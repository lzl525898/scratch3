import PropTypes from 'prop-types';
import React from 'react';
import Box from '../box/box.jsx';
import Meter from '../meter/meter.jsx';
import Waveform from '../waveform/waveform.jsx';

import styles from './record-modal.css';
import stopIcon from './icon--stop-recording.svg';

const RecordingStep = props => (
    <Box>
        <Box className={styles.visualizationContainer}>
            <Box className={styles.meterContainer}>
                <Meter
                    height={172}
                    level={props.level}
                    width={20}
                />
            </Box>
            <Box className={styles.waveformContainer}>
                {props.levels ? (
                    <Waveform
                        data={props.levels}
                        height={150}
                        level={0}
                        width={440}
                    />
                ) : (
                    <span className={styles.helpText}>
                        {props.listening ? '单击下面的按钮开始录制' :
                            '↖️ \u00A0我们需要你允许使用你的麦克风'}
                    </span>
                )}
            </Box>
        </Box>
        <Box className={styles.mainButtonRow}>
            <button
                className={styles.mainButton}
                disabled={!props.listening}
                onClick={props.recording ? props.onStopRecording : props.onRecord}
            >
                {props.recording ? (
                    <img src={stopIcon} />
                ) : (
                    <svg
                        className={styles.recordButton}
                        height="52"
                        width="52"
                    >
                        <circle
                            className={styles.recordButtonCircle}
                            cx="26"
                            cy="26"
                            r="25"
                        />
                        <circle
                            className={styles.recordButtonCircleOutline}
                            cx="26"
                            cy="26"
                            r={27 + (props.level * 5)}
                        />
                    </svg>
                )}
                <div className={styles.helpText}>
                    <span className={styles.recordingText}>
                        {props.recording ? '停止' : '录制'}
                    </span>
                </div>
            </button>
        </Box>
    </Box>
);

RecordingStep.propTypes = {
    level: PropTypes.number,
    levels: PropTypes.arrayOf(PropTypes.number),
    listening: PropTypes.bool,
    onRecord: PropTypes.func.isRequired,
    onStopRecording: PropTypes.func.isRequired,
    recording: PropTypes.bool
};

export default RecordingStep;
