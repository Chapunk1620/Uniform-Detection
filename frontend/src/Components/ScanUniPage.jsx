import React, { useRef, useState, useEffect } from "react";
import heic2any from "heic2any";
import Webcam from "react-webcam";
import { Button, Loader, Paper, Text, Title } from "@mantine/core";

import { apiFetch } from "../config/api";
import classes from "../css/Scanner.module.css";

const isHeicImage = (file) => {
	const fileName = file.name?.toLowerCase() || "";
	const fileType = file.type?.toLowerCase() || "";

	return (
		fileType === "image/heic" ||
		fileType === "image/heif" ||
		fileName.endsWith(".heic") ||
		fileName.endsWith(".heif")
	);
};

const renderImageFileToJpegBlob = (file) => {
	return new Promise((resolve, reject) => {
		const imageUrl = URL.createObjectURL(file);
		const image = new Image();

		image.onload = () => {
			try {
				const canvas = document.createElement("canvas");
				canvas.width = image.naturalWidth || image.width;
				canvas.height = image.naturalHeight || image.height;

				const context = canvas.getContext("2d");
				context.drawImage(image, 0, 0, canvas.width, canvas.height);

				canvas.toBlob(
					(blob) => {
						URL.revokeObjectURL(imageUrl);
						if (blob) {
							resolve(blob);
						} else {
							reject(new Error("Failed to prepare uploaded image."));
						}
					},
					"image/jpeg",
					0.95,
				);
			} catch (error) {
				URL.revokeObjectURL(imageUrl);
				reject(error);
			}
		};

		image.onerror = () => {
			URL.revokeObjectURL(imageUrl);
			reject(
				new Error(
					"The selected image format cannot be previewed by this browser. Please choose a JPG, PNG, HEIC, or HEIF image.",
				),
			);
		};

		image.src = imageUrl;
	});
};

const convertImageFileToJpegBlob = async (file) => {
	if (isHeicImage(file)) {
		const converted = await heic2any({
			blob: file,
			toType: "image/jpeg",
			quality: 0.95,
		});

		return Array.isArray(converted) ? converted[0] : converted;
	}

	return renderImageFileToJpegBlob(file);
};

const createUploadPreviewUrl = async (file) => {
	if (!file) return null;

	if (isHeicImage(file)) {
		const jpegBlob = await convertImageFileToJpegBlob(file);
		return URL.createObjectURL(jpegBlob);
	}

	return URL.createObjectURL(file);
};

const STATUS_STYLES = {
	complete_uniform: {
		success: true,
		className: classes.validationSuccess,
		buttonColor: "teal",
	},
	incomplete_uniform: {
		success: false,
		className: classes.validationError,
		buttonColor: "red",
	},
	improper_uniform: {
		success: false,
		className: classes.validationError,
		buttonColor: "red",
	},
	uncertain: {
		success: false,
		className: classes.validationWarning,
		buttonColor: "yellow",
	},
};

function ScanUniPage({ student, setStudent }) {
	const webcamRef = useRef(null);
	const [isScanning, setIsScanning] = useState(false);
	const [validationResult, setValidationResult] = useState(null);
	const [isNextStudent, setIsNextStudent] = useState(false);
	const [resultImage, setResultImage] = useState(null);
	const [countdown, setCountdown] = useState(null);
	const [cameraError, setCameraError] = useState(null);
	const [uploadedImage, setUploadedImage] = useState(null);
	const [uploadedImagePreview, setUploadedImagePreview] = useState(null);

	const handleCameraError = (error) => {
		console.error("Camera access error:", error);
		setCameraError(
			"Camera access is blocked or unavailable. On mobile, use HTTPS (for example ngrok) instead of an IP address with http.",
		);
	};

	const resetForNextStudent = () => {
		setStudent(null);
		setValidationResult(null);
		setResultImage(null);
		setUploadedImage(null);
		setUploadedImagePreview(null);
		setIsNextStudent(false);
	};

	const handleUploadedImageChange = async (event) => {
		const file = event.target.files?.[0] || null;
		setUploadedImage(file);
		setValidationResult(null);
		setResultImage(null);

		if (uploadedImagePreview) {
			URL.revokeObjectURL(uploadedImagePreview);
		}

		setUploadedImagePreview(null);

		if (!file) return;

		try {
			setUploadedImagePreview(await createUploadPreviewUrl(file));
		} catch (error) {
			console.error("Uploaded image preview error:", error);
			setUploadedImage(null);
			setValidationResult({
				success: false,
				className: classes.validationError,
				message:
					error.message ||
					"Failed to preview the uploaded image. Please choose another image.",
			});
		}
	};

	const startCountdownThenScan = () => {
		setValidationResult(null);
		setIsNextStudent(false);

		if (uploadedImage) {
			scanUploadedImage();
			return;
		}

		setCountdown(3);
	};

	useEffect(() => {
		if (countdown === null) return;

		if (countdown > 0) {
			const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
			return () => clearTimeout(timer);
		}

		// Countdown reached 0; fire the scan.
		setCountdown(null);
		runScan();
	}, [countdown]);

	useEffect(() => {
		return () => {
			if (uploadedImagePreview) {
				URL.revokeObjectURL(uploadedImagePreview);
			}
		};
	}, [uploadedImagePreview]);

	const submitImageForScan = async (imageBlob, fileName = "snapshot.jpg") => {
		setIsScanning(true);
		setValidationResult(null);
		setIsNextStudent(false);

		try {
			const formData = new FormData();
			formData.append("image", imageBlob, fileName);

			const apiResponse = await apiFetch(`/api/scan/unif/${student.id}/`, {
				method: "POST",
				body: formData,
			});
			const result = await apiResponse.json();

			if (!apiResponse.ok) {
				setValidationResult({
					success: false,
					className: classes.validationError,
					message: result.error || "Failed to process the scan.",
				});
				return;
			}

			const statusStyle =
				STATUS_STYLES[result.status] || STATUS_STYLES.uncertain;
			const bestDetection = result.bestDetection
				? `${result.bestDetection.class_name} (${(result.bestDetection.confidence * 100).toFixed(0)}%)`
				: "No confident detection";

			setResultImage(`data:image/jpeg;base64,${result.image}`);
			setValidationResult({
				success: statusStyle.success,
				className: statusStyle.className,
				buttonColor: statusStyle.buttonColor,
				message: `${result.student.fullName}: ${result.statusLabel}`,
				details: result.message,
				ruleSummary: result.ruleSummary,
				bestDetection,
				count: result.detectedObjects.length,
			});
			setIsNextStudent(Boolean(result.shouldAdvance));
		} catch (error) {
			console.error("Uniform scan error:", error);
			setValidationResult({
				success: false,
				className: classes.validationError,
				message: "Network error or invalid response format.",
			});
		} finally {
			setIsScanning(false);
		}
	};

	const runScan = async () => {
		const imageSrc = webcamRef.current?.getScreenshot();

		if (!imageSrc) {
			setValidationResult({
				success: false,
				className: classes.validationError,
				message: "Failed to capture image from webcam.",
			});
			return;
		}

		const response = await fetch(imageSrc);
		const blob = await response.blob();
		await submitImageForScan(blob, "snapshot.jpg");
	};

	const scanUploadedImage = async () => {
		if (!uploadedImage) {
			setValidationResult({
				success: false,
				className: classes.validationError,
				message: "Please choose an image file first.",
			});
			return;
		}

		try {
			const jpegBlob = await convertImageFileToJpegBlob(uploadedImage);
			await submitImageForScan(jpegBlob, "uploaded-uniform.jpg");
		} catch (error) {
			console.error("Uploaded image preparation error:", error);
			setValidationResult({
				success: false,
				className: classes.validationError,
				message: error.message || "Failed to prepare uploaded image.",
			});
		}
	};

	const buttonColor = uploadedImage
		? "blue"
		: validationResult?.buttonColor || "teal";

	return (
		<div className={classes.scannerContainer}>
			<Title className={classes.scannerTitle} order={3}>
				Student Uniform Checker
			</Title>
			<Paper shadow="lg" radius="lg" p="xl" withBorder>
				<Text className={classes.helperText}>
					{uploadedImage
						? "Uploaded photo selected. This image will be scanned instead of the camera feed."
						: "Center one student in frame, keep the camera steady, and make sure both the uniform top and pants are visible."}
				</Text>

				<div className={classes.webcamContainer}>
					{uploadedImagePreview ? (
						<img
							src={uploadedImagePreview}
							alt="Uploaded uniform test"
							className={classes.uploadedPreviewImage}
						/>
					) : (
						<>
							<Webcam
								ref={webcamRef}
								audio={false}
								onUserMedia={() => setCameraError(null)}
								onUserMediaError={handleCameraError}
								screenshotFormat="image/jpeg"
								screenshotQuality={1}
								forceScreenshotSourceSize={true}
								width={860}
								height={600}
								videoConstraints={{
									width: { ideal: 1920 },
									height: { ideal: 1080 },
									facingMode: { ideal: "environment" },
								}}
							/>
							{cameraError && (
								<div className={classes.cameraErrorOverlay}>
									<Text fw={600}>Camera not available</Text>
									<Text size="sm" mt={6}>
										{cameraError}
									</Text>
								</div>
							)}
						</>
					)}
					<div className={classes.scanOverlay} />
					<div className={`${classes.scannerCorner} ${classes.topLeft}`} />
					<div className={`${classes.scannerCorner} ${classes.topRight}`} />
					<div className={`${classes.scannerCorner} ${classes.bottomLeft}`} />
					<div className={`${classes.scannerCorner} ${classes.bottomRight}`} />
					{countdown !== null && (
						<div className={classes.countdownOverlay}>
							<div className={classes.countdownCircle}>
								<span className={classes.countdownNumber}>{countdown}</span>
							</div>
						</div>
					)}
					{isScanning && (
						<div className={classes.loadingOverlay}>
							<Loader color="teal" size="lg" />
						</div>
					)}
				</div>

				<div className={classes.uploadSection}>
					<Text fw={600}>Test With Uploaded Image</Text>
					<Text size="sm" c="dimmed" mt={4}>
						Choose a saved photo. JPG, PNG, HEIC, and HEIF images are supported.
						Once selected, the preview and Scan Uniform button use that image
						instead of the camera.
					</Text>
					<input
						className={classes.fileInput}
						type="file"
						accept="image/*,.heic,.heif"
						onChange={handleUploadedImageChange}
					/>
					{uploadedImage && (
						<Text size="sm" mt={6}>
							Selected: {uploadedImage.name}
						</Text>
					)}
				</div>

				{validationResult && (
					<div
						className={`${classes.validationMessage} ${validationResult.className}`}
					>
						<Text fw={600}>{validationResult.message}</Text>
						{validationResult.details && (
							<Text size="sm" mt={6}>
								{validationResult.details}
							</Text>
						)}
						{validationResult.ruleSummary && (
							<Text size="sm" mt={6}>
								Upper uniform: {validationResult.ruleSummary.hasUniformTop ? "accepted" : validationResult.ruleSummary.detectedUniformTop ? "low confidence" : "not detected"} | Lower uniform: {validationResult.ruleSummary.hasUniformPants ? "accepted" : validationResult.ruleSummary.detectedUniformPants ? "low confidence" : "not detected"} | Whole uniform: {validationResult.ruleSummary.hasCompleteUniform ? "accepted" : validationResult.ruleSummary.detectedCompleteUniform ? "low confidence" : "not detected"}
							</Text>
						)}
						<Text size="sm" mt={6}>
							Best detection: {validationResult.bestDetection} | Objects kept:{" "}
							{validationResult.count}
						</Text>
					</div>
				)}

				{resultImage && (
					<div className={classes.resultCard}>
						<Text fw={600}>Latest Scan Result</Text>
						<img
							src={resultImage}
							alt="Detected uniform frame"
							className={classes.resultImage}
						/>
					</div>
				)}

				<Button
					className={classes.scanButton}
					fullWidth
					radius="md"
					size="lg"
					onClick={startCountdownThenScan}
					loading={isScanning}
					disabled={countdown !== null || isScanning}
					color={buttonColor}
				>
					{isScanning
						? "Scanning..."
						: countdown !== null
							? `Starting in ${countdown}...`
							: uploadedImage
								? "Scan Uploaded Image"
								: validationResult?.success === false
									? "Scan Again"
									: "Scan Uniform"}
				</Button>

				{isNextStudent && (
					<Button
						className={classes.scanButton}
						fullWidth
						radius="md"
						size="lg"
						onClick={resetForNextStudent}
						color="teal"
						variant="light"
					>
						Next Student
					</Button>
				)}
			</Paper>
		</div>
	);
}

export default ScanUniPage;
