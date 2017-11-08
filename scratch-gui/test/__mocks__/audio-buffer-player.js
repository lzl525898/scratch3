export default class MockAudioBufferPlayer {
    constructor (samples, sampleRate) {
        this.samples = samples;
        this.sampleRate = sampleRate;
        this.play = jest.fn((trimStart, trimEnd, onUpdate) => {
            this.onUpdate = onUpdate;
        });
        this.stop = jest.fn();
        MockAudioBufferPlayer.instance = this;
    }
}
