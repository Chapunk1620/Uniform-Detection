import React, { useEffect, useRef, useState } from 'react';
import Webcam from 'react-webcam';
import {
  Badge,
  Button,
  Group,
  Loader,
  Paper,
  Select,
  SimpleGrid,
  Text,
  Textarea,
  Title,
} from '@mantine/core';

import { apiFetch } from '../config/api';
import classes from '../css/Scanner.module.css';

const labelOptions = [
  { value: 'CompleteUniform', label: 'Complete Uniform' },
  { value: 'UniformTop', label: 'Uniform Top' },
  { value: 'UniformPants', label: 'Uniform Pants' },
  { value: 'NeedsReview', label: 'Needs Review' },
];

function UniformTrainingCapture() {
  const webcamRef = useRef(null);
  const [isSaving, setIsSaving] = useState(false);
  const [expectedLabel, setExpectedLabel] = useState('CompleteUniform');
  const [notes, setNotes] = useState('');
  const [feedback, setFeedback] = useState(null);
  const [savedCount, setSavedCount] = useState(0);
  const [recentSamples, setRecentSamples] = useState([]);

  const loadRecentSamples = async () => {
    try {
      const response = await apiFetch('/api/training-samples/');
      if (!response.ok) {
        return;
      }

      const data = await response.json();
      setRecentSamples(data);
    } catch (error) {
      console.error('Failed to load recent training samples:', error);
    }
  };

  useEffect(() => {
    loadRecentSamples();
  }, []);

  const captureSample = async () => {
    setIsSaving(true);
    setFeedback(null);

    try {
      const imageSrc = webcamRef.current?.getScreenshot();
      if (!imageSrc) {
        setFeedback({ type: 'error', message: 'Failed to capture image from webcam.' });
        return;
      }

      const imageResponse = await fetch(imageSrc);
      const blob = await imageResponse.blob();

      const formData = new FormData();
      formData.append('image', blob, `training-sample-${Date.now()}.jpg`);
      formData.append('expected_label', expectedLabel);
      formData.append('notes', notes);

      const response = await apiFetch('/api/training-samples/', {
        method: 'POST',
        body: formData,
      });
      const result = await response.json();

      if (!response.ok) {
        const errorMessage = result.error || 'Failed to save training sample.';
        setFeedback({ type: 'error', message: errorMessage });
        return;
      }

      setSavedCount((current) => current + 1);
      setNotes('');
      setFeedback({
        type: 'success',
        message: `Saved sample as ${result.expected_label}.`,
      });
      setRecentSamples((current) => [result, ...current].slice(0, 12));
    } catch (error) {
      console.error('Failed to save training sample:', error);
      setFeedback({ type: 'error', message: 'Network error while saving sample.' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className={classes.scannerContainer}>
      <Title className={classes.scannerTitle} order={3}>Uniform Training Samples</Title>
      <Paper shadow="lg" radius="lg" p="xl" withBorder>
        <Text className={classes.helperText}>
          Capture clean reference images for future training. Keep one student centered, show the expected uniform clearly, and save each sample with the correct label.
        </Text>

        <Group justify="space-between" mb="md">
          <Badge color="teal" size="lg">Saved This Session: {savedCount}</Badge>
          <Badge color="blue" variant="light">Recent Stored Samples: {recentSamples.length}</Badge>
        </Group>

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
          {isSaving && (
            <div className={classes.loadingOverlay}>
              <Loader color="teal" size="lg" />
            </div>
          )}
        </div>

        <div className={classes.captureForm}>
          <Select
            label="Expected Label"
            data={labelOptions}
            value={expectedLabel}
            onChange={(value) => setExpectedLabel(value || 'CompleteUniform')}
            allowDeselect={false}
          />
          <Textarea
            label="Notes"
            placeholder="Optional notes about lighting, pose, or issues in the sample"
            value={notes}
            onChange={(event) => setNotes(event.currentTarget.value)}
            minRows={3}
          />
        </div>

        {feedback && (
          <div className={`${classes.validationMessage} ${feedback.type === 'success' ? classes.validationSuccess : classes.validationError}`}>
            <Text fw={600}>{feedback.message}</Text>
          </div>
        )}

        <Button
          className={classes.scanButton}
          fullWidth
          radius="md"
          size="lg"
          onClick={captureSample}
          loading={isSaving}
          color="teal"
        >
          {isSaving ? 'Saving Sample...' : 'Capture And Save Sample'}
        </Button>

        <div className={classes.recentSamplesSection}>
          <Text fw={600} mb="sm">Recent Samples</Text>
          <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="md">
            {recentSamples.map((sample) => (
              <div key={sample.id} className={classes.sampleCard}>
                {sample.image_url && (
                  <img
                    src={sample.image_url}
                    alt={sample.expected_label}
                    className={classes.sampleCardImage}
                  />
                )}
                <Text fw={600}>{sample.expected_label}</Text>
                <Text size="sm" c="dimmed">{new Date(sample.created).toLocaleString()}</Text>
                {sample.notes && <Text size="sm">{sample.notes}</Text>}
              </div>
            ))}
          </SimpleGrid>
        </div>
      </Paper>
    </div>
  );
}

export default UniformTrainingCapture;
