import React, { useRef, useState } from 'react';
import Webcam from 'react-webcam';
import { Button, Loader, Paper, Text, Title } from '@mantine/core';

import { apiFetch } from '../config/api';
import classes from '../css/Scanner.module.css';

const STATUS_STYLES = {
  complete_uniform: {
    success: true,
    className: classes.validationSuccess,
    buttonColor: 'teal',
  },
  incomplete_uniform: {
    success: false,
    className: classes.validationError,
    buttonColor: 'red',
  },
  uncertain: {
    success: false,
    className: classes.validationWarning,
    buttonColor: 'yellow',
  },
};

function ScanUniPage({ student, setStudent }) {
  const webcamRef = useRef(null);
  const [isScanning, setIsScanning] = useState(false);
  const [validationResult, setValidationResult] = useState(null);
  const [isNextStudent, setIsNextStudent] = useState(false);
  const [resultImage, setResultImage] = useState(null);

  const resetForNextStudent = () => {
    setStudent(null);
    setValidationResult(null);
    setResultImage(null);
    setIsNextStudent(false);
  };

  const scanImage = async () => {
    setIsScanning(true);
    setValidationResult(null);
    setIsNextStudent(false);

    try {
      const imageSrc = webcamRef.current?.getScreenshot();
      if (!imageSrc) {
        setValidationResult({
          success: false,
          className: classes.validationError,
          message: 'Failed to capture image from webcam.',
        });
        return;
      }

      const response = await fetch(imageSrc);
      const blob = await response.blob();

      const formData = new FormData();
      formData.append('image', blob, 'snapshot.jpg');

      const apiResponse = await apiFetch(
        `/api/scan/unif/${student.id}/`,
        { method: 'POST', body: formData }
      );
      const result = await apiResponse.json();

      if (!apiResponse.ok) {
        setValidationResult({
          success: false,
          className: classes.validationError,
          message: result.error || 'Failed to process the scan.',
        });
        return;
      }

      const statusStyle = STATUS_STYLES[result.status] || STATUS_STYLES.uncertain;
      const bestDetection = result.bestDetection
        ? `${result.bestDetection.class_name} (${(result.bestDetection.confidence * 100).toFixed(0)}%)`
        : 'No confident detection';

      setResultImage(`data:image/jpeg;base64,${result.image}`);
      setValidationResult({
        success: statusStyle.success,
        className: statusStyle.className,
        buttonColor: statusStyle.buttonColor,
        message: `${result.student.fullName}: ${result.statusLabel}`,
        details: result.message,
        bestDetection,
        count: result.detectedObjects.length,
      });
      setIsNextStudent(Boolean(result.shouldAdvance));
    } catch (error) {
      console.error('Uniform scan error:', error);
      setValidationResult({
        success: false,
        className: classes.validationError,
        message: 'Network error or invalid response format.',
      });
    } finally {
      setIsScanning(false);
    }
  };

  const buttonColor = validationResult?.buttonColor || 'teal';

  return (
    <div className={classes.scannerContainer}>
      <Title className={classes.scannerTitle} order={3}>Student Uniform Checker</Title>
      <Paper shadow="lg" radius="lg" p="xl" withBorder>
        <Text className={classes.helperText}>
          Center one student in frame, keep the camera steady, and make sure both the uniform top and pants are visible.
        </Text>

        <div className={classes.webcamContainer}>
          <Webcam
            ref={webcamRef}
            audio={false}
            screenshotFormat="image/jpeg"
            screenshotQuality={0.92}
            width={860}
            height={600}
            videoConstraints={{
              width: { ideal: 1280 },
              height: { ideal: 720 },
              facingMode: { ideal: 'environment' },
            }}
          />
          <div className={classes.scanOverlay} />
          <div className={`${classes.scannerCorner} ${classes.topLeft}`} />
          <div className={`${classes.scannerCorner} ${classes.topRight}`} />
          <div className={`${classes.scannerCorner} ${classes.bottomLeft}`} />
          <div className={`${classes.scannerCorner} ${classes.bottomRight}`} />
          {isScanning && (
            <div className={classes.loadingOverlay}>
              <Loader color="teal" size="lg" />
            </div>
          )}
        </div>

        {validationResult && (
          <div className={`${classes.validationMessage} ${validationResult.className}`}>
            <Text fw={600}>{validationResult.message}</Text>
            {validationResult.details && (
              <Text size="sm" mt={6}>{validationResult.details}</Text>
            )}
            <Text size="sm" mt={6}>
              Best detection: {validationResult.bestDetection} | Objects kept: {validationResult.count}
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
          onClick={scanImage}
          loading={isScanning}
          color={buttonColor}
        >
          {isScanning ? 'Scanning...' : validationResult?.success === false ? 'Scan Again' : 'Scan Uniform'}
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
