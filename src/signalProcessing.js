class SignalProcessor {
    constructor() {
        this.audioCtx = new AudioContext({ sampleRate: 100000 });

        //buffer length, #input, #output
        this.scriptProc = this.audioCtx.createScriptProcessor(0, 1, 1);

        //data storage
        this.dataBuffer = new Float32Array((this.audioCtx.sampleRate * 0.1) * 2);
        this.bufferIndex = 0;
        this.bufferSize = 0.1;

    }



    /**
     * @param {number} _size
     */
    set setBufferSize(_size) {
        this.bufferSize = _size;
        this.bufferIndex = 0;
        this.dataBuffer = new Float32Array((this.audioCtx.sampleRate * this.bufferSize) * 2);
    }


    async askForMic() {
        const userMic = await navigator.mediaDevices.getUserMedia({ audio: { noiseSuppression: false, echoCancellation: false, autoGainControl: false } });
        const mediaStream = this.audioCtx.createMediaStreamSource(userMic);
        this.scriptProc.connect(this.audioCtx.destination);
        mediaStream.connect(this.scriptProc);
        this.audioCtx.resume();
    }

}