class ScopeScreen {
    constructor(_box, _screenArea, _screen, _voltText, _timeText, _triggerText, _minWidth, _maxWidth, _powerState) {

        /* HTML elements IDs */
        this.scopeBox = document.getElementById(_box);
        this.screenArea = document.getElementById(_screenArea);
        /** @type {HTMLCanvasElement} */
        this.screen = document.getElementById(_screen);
        this.ctx = this.screen.getContext('2d');
        this.volt = document.getElementById(_voltText);
        this.time = document.getElementById(_timeText);
        this.trigger = document.getElementById(_triggerText);

        /* Variables */
        this.minWidth = _minWidth;
        this.maxWidth = _maxWidth;
        this.aspectRatio = 5 / 4;
        this.horizontalTicks = 50;
        this.verticalTicks = 40;
        this.horizontalDivs = 10;
        this.verticalDivs = 8;
        this.bigTickLength = 30;
        this.tinyTickLength = 6;
        this.axisThickness = 4;
        this.gridThickness = 2;
        /* This gives 'rounded' dots */
        this.tickThickness = this.tinyTickLength;

        /* Scope color palette */
        this.gridOffColor = 'rgb(40, 40, 40)';
        this.gridOnColor = 'rgb(120, 225, 255)';
        this.backgroundOffColor = 'rgb(60, 60, 60)';
        this.backgroundOnColor = 'rgb(0, 55, 77)';
        this.overlayColor = 'rgb(25, 255, 200)';
        this.triggerOverlayColor = 'rgb(255, 255, 0)';

        /* Default css state */
        this.gridColor = this.gridOffColor;
        this.backgroundColor = this.backgroundOffColor;
        this.volt.style.zIndex = -1;
        this.time.style.zIndex = -1;
        this.trigger.style.zIndex = -1
        this.triggerOffset = 0;
        this.verticalOffset = 0;
        this.horizontalOffset = 0;
        this.verticalGain = 0;
        this.slope = false;

        this.updateScopeBox();

    }


    /* Canvas drawing of the passed buffer, after triggering, adding offsets, scaling etc */
    drawTrace(_buffer, _self) {
        if (!scopePowerState) { return };

        //full oversampled buffer
        let B1 = new Float32Array(_buffer.length);
        for (let i = 0; i < B1.length; i++) { B1[i] = (_buffer[i] + this.verticalOffset) / this.verticalGain; }

        //extracted samples buffer
        let B2 = new Float32Array(B1.length / 2);


        let triggerClip = B1.length / 10;
        let L = B1.length;
        let W = _self.screen.width;
        let h = _self.screen.height / 2;
        let k = B2.length / W;
        let slopeWindow = 2;
        let triggerTolerance = 1e-3;
        let xi = L / 2;
        let triggered = false;
        document.getElementById('triggerLED').style.backgroundColor = this.backgroundOffColor;


        //get triggered x coordinate
        for (let x = ((L / 2) - triggerClip); (x <= ((L / 2) + triggerClip) && (!triggered)); x++) {

            switch (this.slope) {
                case false:
                    if ((B1[x - slopeWindow] > (this.triggerOffset - triggerTolerance)) && (B1[x + slopeWindow] < (this.triggerOffset + triggerTolerance))) {

                        xi = x + slopeWindow;
                        triggered = true;
                        document.getElementById('triggerLED').style.backgroundColor = this.overlayColor;
                        break;

                    }
                    break;

                case true:
                    if ((B1[x - slopeWindow] < (this.triggerOffset - triggerTolerance)) && (B1[x + slopeWindow] > (this.triggerOffset + triggerTolerance))) {

                        xi = x + slopeWindow;
                        triggered = true;
                        document.getElementById('triggerLED').style.backgroundColor = this.overlayColor;
                        break;

                    }
                    break;
            }


        }



        //extract good buffer portion
        for (let x = -(L / 4); x < (L / 4); x++) {

            B2[x + L / 4] = B1[x + xi + this.horizontalOffset];

        }

        //clear screen
        _self.updateScopeBox();
        _self.ctx.strokeStyle = _self.overlayColor;

        this.drawTrigger();

        //draw buffer
        _self.ctx.beginPath();
        _self.ctx.moveTo(0, (B2[0] + 1) * h);
        for (let x = 0; x < W; x++) {

            _self.ctx.lineTo(x, (B2[x * k] + 1) * h);

        }
        _self.ctx.stroke();

    }


    /* Flip-flop */
    changePowerState(_caller) {
        if (!scopePowerState) { this.scopePowerOn(_caller); }
        else { this.scopePowerOff(_caller); }
        scopePowerState = !scopePowerState;
    }

    /* Turn off the scope screen */
    scopePowerOff(_caller) {
        this.ctx.clearRect(0, 0, this.screen.width, this.screen.height);

        this.gridColor = this.gridOffColor;
        this.backgroundColor = this.backgroundOffColor;

        _caller.style.boxShadow = '3px 3px ' + this.backgroundOffColor;
        this.volt.style.color = this.backgroundOffColor;
        this.time.style.color = this.backgroundOffColor;
        this.trigger.style.color = this.backgroundOffColor;
        document.getElementById('triggerLED').style.backgroundColor = this.backgroundOffColor;

        this.volt.style.zIndex = -10;
        this.time.style.zIndex = -10;
        this.trigger.style.zIndex = -10;

        stopLoop();

        this.updateScopeBox();
    }

    /* Turn on the scope screen */
    scopePowerOn(_caller) {
        this.ctx.clearRect(0, 0, this.screen.width, this.screen.height);

        this.gridColor = this.gridOnColor;
        this.backgroundColor = this.backgroundOnColor;

        _caller.style.boxShadow = '-1px -1px ' + this.backgroundOffColor;
        this.volt.style.color = this.overlayColor;
        this.time.style.color = this.overlayColor;
        this.trigger.style.color = this.triggerOverlayColor;

        playLoop('Fan', 0.025);
        backgroundAudio.addEventListener('timeupdate', function () {
            if (!scopePowerState) {
                if (backgroundAudio != null) {
                    stopLoop();
                }
                return;
            }
            var buffer = 1;
            if (this.currentTime > this.duration - buffer) {
                this.currentTime = 0;
                this.play();
            }
        });

        //setTimeout(() => {
        this.volt.style.zIndex = 1;
        this.time.style.zIndex = 1;
        this.trigger.style.zIndex = 1;
        this.updateScopeBox();
        //}, 2000);



    }

    /* Calls the functions to draw passive elements such as the axis, grid */
    updateScopeBox() {

        this.screen.style.backgroundColor = this.backgroundColor;

        this.ctx.clearRect(0, 0, this.screen.width, this.screen.height);
        this.drawPattern();
    }

    /* Draw axis & grid */
    drawPattern() {
        this.drawGrid();
        this.drawTick();
    }

    drawGrid() {

        for (let x = 0; x <= this.horizontalDivs; x++) {

            this.ctx.beginPath();
            this.ctx.lineWidth = this.gridThickness;
            this.ctx.strokeStyle = this.gridColor;

            if (x == 5) {
                this.ctx.lineWidth = this.axisThickness;
                this.ctx.strokeStyle = this.axisColor;
            }

            this.ctx.moveTo(x * (this.screen.width / this.horizontalDivs), 0);
            this.ctx.lineTo(x * (this.screen.width / this.horizontalDivs), this.screen.height);
            this.ctx.stroke();

        }

        for (let y = 0; y <= this.verticalDivs; y++) {

            this.ctx.beginPath();
            this.ctx.lineWidth = this.gridThickness;
            this.ctx.strokeStyle = this.gridColor;

            if (y == this.verticalDivs / 2) {
                this.ctx.lineWidth = this.axisThickness;
                this.ctx.strokeStyle = this.axisColor;
            }

            this.ctx.moveTo(0, y * (this.screen.height / this.verticalDivs));
            this.ctx.lineTo(this.screen.width, y * (this.screen.height / this.verticalDivs));
            this.ctx.stroke();

        }
    }

    drawTick() {

        for (let y = 0; y <= this.verticalDivs; y++) {

            let _length = this.tinyTickLength;
            let _thick = this.tickThickness;

            if (y == this.verticalDivs / 2) {
                _length = this.bigTickLength;
                _thick = this.axisThickness;
            }

            for (let x = 0; x <= this.horizontalTicks; x++) {
                this.ctx.beginPath();
                this.ctx.lineWidth = _thick;
                this.ctx.moveTo(x * (this.screen.width / this.horizontalTicks), (y * (this.screen.height / this.verticalDivs)) - (_length / 2));
                this.ctx.lineTo(x * (this.screen.width / this.horizontalTicks), (y * (this.screen.height / this.verticalDivs)) + (_length / 2));
                this.ctx.stroke();
            }

        }

        for (let x = 0; x <= this.horizontalDivs; x++) {

            let _length = this.tinyTickLength;
            let _thick = this.tickThickness;
            if (x == this.horizontalDivs / 2) {
                _length = this.bigTickLength;
                _thick = this.axisThickness;
            }

            for (let y = 0; y <= this.verticalTicks; y++) {
                this.ctx.beginPath();
                this.ctx.lineWidth = _thick;
                this.ctx.moveTo((x * (this.screen.width / this.horizontalDivs)) - (_length / 2), y * (this.screen.height / this.verticalTicks));
                this.ctx.lineTo((x * (this.screen.width / this.horizontalDivs)) + (_length / 2), y * (this.screen.height / this.verticalTicks));
                this.ctx.stroke();
            }

        }

    }

    /* Draws the graphical trigger level reference line */
    drawTrigger() {
        this.ctx.strokeStyle = this.triggerOverlayColor;
        this.ctx.setLineDash([25, 25]);
        this.ctx.beginPath();
        this.ctx.moveTo(0, (this.triggerOffset + 1) * this.screen.height / 2);
        this.ctx.lineTo(this.screen.width, (this.triggerOffset + 1) * this.screen.height / 2);
        this.ctx.stroke();
        this.ctx.strokeStyle = this.overlayColor;
        this.ctx.setLineDash([1, 0]);
    }

}