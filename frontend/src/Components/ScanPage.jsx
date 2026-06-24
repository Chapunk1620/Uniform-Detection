import React, { useRef, useState, useEffect } from 'react'
import Webcam from "react-webcam";
import { Paper, Button, Title, Loader, Text, Switch } from "@mantine/core";
// import { showNotification } from "@mantine/notifications";
import { apiFetch } from '../config/api';
import classes from "../css/Scanner.module.css";
import ScanUniPage from './ScanUniPage';

function ScanPage({setPage}) {
    const webcamRef = useRef(null);
    const [isScanning, setIsScanning] = useState(false);
    const [validationResult, setValidationResult] = useState(null);
    const [student, setStudent] = useState(null);
    const [isWashDay, setIsWashDay] = useState(false);
    const [cameraError, setCameraError] = useState(null);
    const [isAutoScanning, setIsAutoScanning] = useState(false);
    const isProcessingRef = useRef(false);
    const studentRef = useRef(null);
    const isWashDayRef = useRef(false);
    const lastDetectedRef = useRef('');

    const handleCameraError = (error) => {
      console.error('Camera access error:', error);
      setCameraError(
        'Camera access is blocked or unavailable. On mobile, use HTTPS (for example ngrok) instead of an IP address with http.'
      );
    };

    const washDayLog = async () => {

        
        if (webcamRef.current) {
          const imageSrc = webcamRef.current.getScreenshot();
          if (!imageSrc) {
            
            console.error("Failed to capture image from webcam.");
            return;
          }
    
          const byteCharacters = atob(imageSrc.split(",")[1]);
          const byteNumbers = Array.from(byteCharacters, (char) =>
            char.charCodeAt(0)
          );
          const byteArray = new Uint8Array(byteNumbers);
          const blob = new Blob([byteArray], { type: "image/png" });
    
          const formData = new FormData();
          formData.append("image", blob, "snapshot.png");
            
     
            const response = await apiFetch(
              '/api/scan/qr',
              { method: "POST", body: formData }
            );
            const result = await response.json();
            console.log(result);
            setValidationResult({
              success: true,
              message: `Student ID validated: ${result.fullName}`
            });
            

            const response2 = await apiFetch(
              `/api/washday/${result.id}/`,
              { method: "POST", body: formData }
            );
            const result2 = await response.json();
            console.log(result);
        }

    }

    const scanImage = async () => {
        setIsScanning(true);
        setValidationResult(null);
        if (webcamRef.current) {
          const imageSrc = webcamRef.current.getScreenshot();
          if (!imageSrc) {
            setIsScanning(false);
            console.error("Failed to capture image from webcam.");
            return;
          }
    
          const byteCharacters = atob(imageSrc.split(",")[1]);
          const byteNumbers = Array.from(byteCharacters, (char) =>
            char.charCodeAt(0)
          );
          const byteArray = new Uint8Array(byteNumbers);
          const blob = new Blob([byteArray], { type: "image/png" });
    
          const formData = new FormData();
          formData.append("image", blob, "snapshot.png");
    
          try {
            const response = await apiFetch(
              '/api/scan/qr',
              { method: "POST", body: formData }
            );
            const result = await response.json();
            console.log(result);
            
            if (!response.ok) {
              const errorMessage = result.error || 'Failed to process the scan';
              setValidationResult({
                success: false,
                message: errorMessage
              });
              setIsScanning(false);
              return;
            }

            setValidationResult({
              success: true,
              message: `Student ID validated: ${result.fullName}`
            });
            setStudent(result);
    
          } catch (error) {
            console.error("Error processing image:", error);
            console.error('Scan error:', error);
            setValidationResult({
              success: false,
              message: "Network error or invalid response format"
            });
          }
        }
        setIsScanning(false);
      };

    useEffect(() => {
        studentRef.current = student;
        isWashDayRef.current = isWashDay;
    });

    useEffect(() => {
        let detector = null;
        let errorTimeout = null;
        const useDetector = typeof window !== 'undefined' && 'BarcodeDetector' in window;
        if (useDetector) {
            try {
                detector = new BarcodeDetector({ formats: ['qr_code'] });
            } catch {
                console.warn('BarcodeDetector init failed, using backend fallback');
            }
        }

        const showError = (message) => {
            if (errorTimeout) clearTimeout(errorTimeout);
            setValidationResult({ success: false, message });
            errorTimeout = setTimeout(() => setValidationResult(null), 3000);
        };

        const handleResult = async (result) => {
            if (!result || !result.id) return;
            if (result.studentCode === lastDetectedRef.current) return;
            lastDetectedRef.current = result.studentCode;
            studentRef.current = result;

            if (isWashDayRef.current) {
                await apiFetch(`/api/washday/${result.id}/`, { method: "POST" });
                setValidationResult({
                    success: true,
                    message: `Wash day logged for: ${result.fullName}`
                });
            } else {
                setValidationResult({
                    success: true,
                    message: `Student ID validated: ${result.fullName}`
                });
                setStudent(result);
            }
        };

        const tryScan = async () => {
            if (isProcessingRef.current || studentRef.current) return;
            isProcessingRef.current = true;

            try {
                if (detector) {
                    const video = webcamRef.current?.video;
                    if (video && video.readyState >= 2 && video.videoWidth) {
                        try {
                            const barcodes = await detector.detect(video);
                            if (barcodes.length > 0) {
                                const code = barcodes[0].rawValue;
                                if (code && code !== lastDetectedRef.current) {
                                    const lookupResp = await apiFetch(`/api/scan/qr-code/${code}/`, { method: "GET" });
                                    if (lookupResp.ok) {
                                        await handleResult(await lookupResp.json());
                                    } else {
                                        lastDetectedRef.current = code;
                                        showError('QR code not found in database. Please check and try again.');
                                    }
                                }
                                return;
                            }
                        } catch {}
                    }
                }

                const imageSrc = webcamRef.current?.getScreenshot();
                if (!imageSrc) return;

                const byteCharacters = atob(imageSrc.split(",")[1]);
                const byteNumbers = Array.from(byteCharacters, (char) => char.charCodeAt(0));
                const byteArray = new Uint8Array(byteNumbers);
                const blob = new Blob([byteArray], { type: "image/jpeg" });

                const formData = new FormData();
                formData.append("image", blob, "snapshot.jpg");

                const response = await apiFetch('/api/scan/qr', { method: "POST", body: formData });
                if (response.ok) {
                    await handleResult(await response.json());
                } else {
                    const result = await response.json().catch(() => ({}));
                    if (result.error) {
                        showError(result.error);
                    }
                }
            } catch (err) {
                console.error('Auto-scan error:', err);
            } finally {
                isProcessingRef.current = false;
            }
        };

        const interval = setInterval(tryScan, 1200);
        setIsAutoScanning(true);

        return () => {
            clearInterval(interval);
            setIsAutoScanning(false);
            if (errorTimeout) clearTimeout(errorTimeout);
        };
    }, []);

  return (
    <>
      {!student  ? (<div className={classes.scannerContainer}>
        <Title className={classes.scannerTitle} order={3}>Student ID Scanner</Title>
        <Paper shadow="lg" radius="lg" p="xl" withBorder>
          <div className={classes.webcamContainer}>
            <Webcam
              ref={webcamRef}
              onUserMedia={() => setCameraError(null)}
              onUserMediaError={handleCameraError}
              screenshotFormat="image/jpeg"
              width={560}
              height={400}
              videoConstraints={{
                width: 560,
                height: 400,
                facingMode: "user",
              }}
            />
            {cameraError && (
              <div className={classes.cameraErrorOverlay}>
                <Text fw={600}>Camera not available</Text>
                <Text size="sm" mt={6}>{cameraError}</Text>
              </div>
            )}
            <div className={classes.scanOverlay} />
            <div className={`${classes.scannerCorner} ${classes.topLeft}`} />
            <div className={`${classes.scannerCorner} ${classes.topRight}`} />
            <div className={`${classes.scannerCorner} ${classes.bottomLeft}`} />
            <div className={`${classes.scannerCorner} ${classes.bottomRight}`} />
            {isAutoScanning && (
              <div className={classes.autoScanIndicator}>
                <span className={classes.autoScanDot} />
                Auto-scan active
              </div>
            )}
            {isScanning && (
              <div className={classes.loadingOverlay}>
                <Loader color="teal" size="lg" />
              </div>
            )}
          </div>
          {validationResult && (
            <Text className={`${classes.validationMessage} ${validationResult.success ? classes.validationSuccess : classes.validationError}`}>
              {validationResult.message}
            </Text>
          )}
          <Button
            className={classes.scanButton}
            fullWidth
            radius="md"
            size="lg"
            disabled={isWashDay}
            onClick={scanImage}
            loading={isScanning}
            color={validationResult?.success === false ? "red" : "teal"}
          >
            {isScanning ? 'Scanning...' : validationResult?.success === false ? 'Try Again' : 'Scan ID'}
          </Button>
          <Switch
            label="Is it a wash day?"
            checked={isWashDay}
            onChange={(event) => setIsWashDay(event.currentTarget.checked)}
            mt="md"
            size="md"
            color="teal"
          />
          {isWashDay && (
            <Button
              className={classes.scanButton}
              fullWidth
              radius="md"
              size="lg"
              onClick={washDayLog}
              color="blue"
            >
              Log Wash Day
            </Button>
          )}
        </Paper>
      </div>):<ScanUniPage student={student} setStudent={setStudent} setPage={setPage}/>}
    </>

  )
}

export default ScanPage;
