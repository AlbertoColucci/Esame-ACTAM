class RotaryEncoder {
    constructor(_diameter, _left, _top, _overlayArray, _textTarget, _stepsArray, _father, _globalFather) {

        /* Variables */
        this.width = _diameter;
        this.height = _diameter;
        this.left = _left;
        this.top = _top;
        this.overlayArray = _overlayArray;
        this.textTarget = document.getElementById(_textTarget);
        this.stepsArray = _stepsArray;
        this.father = document.getElementById(_father);
        this.globalFather = document.getElementById(_globalFather);
        this.knob = document.createElement('div');
        this.container = document.createElement('div');
        this.mouseState = 'up';
        this.mouseX = null;
        this.mouseY = null;
        this.value = 0;
        this.angle = this.value;
        this.soundFlag = false;

        /* HTML Elements creation */
        this.father.appendChild(this.container);
        this.container.appendChild(this.knob);


        /* CSS Container Styling */
        this.container.style.width = this.width;
        this.container.style.height = this.height;
        this.container.style.left = this.left;
        this.container.style.top = this.top;
        //debug
        //this.container.style.border = '1px dashed red';
        this.container.style.position = 'absolute';

        /* CSS Knob Styling */
        this.knob.style.width = this.container.style.width;
        this.knob.style.height = this.container.style.height;
        this.knob.style.position = 'absolute';
        this.knob.style.borderRadius = '50%';
        //debug
        //this.knob.style.border = '1px solid black';
        this.knob.style.backgroundImage = "url('img/RotEncoderKnob.png')";
        this.knob.style.backgroundSize = 'cover';
        this.knob.style.display = 'inline-block';

        /* CSS Text Styling */
        if (this.textTarget != null) {
            if (this.overlayArray != null) {
                this.textTarget.textContent = this.overlayArray[this.ticks];
            }
        }

        /*  Event sensitivity  */
        /* _self compensates the 'this' reference */
        var _self = this;

        this.knob.addEventListener('mouseup', () => { this.mouseState = 'up' });
        this.knob.addEventListener('mousedown', () => { this.mouseState = 'down' });
        this.knob.addEventListener('dblclick', () => {
            this.rotation = 0;
            playSound('reset', 0.80);
        });

        this.father.addEventListener("mouseup", () => { this.mouseState = 'up' });
        this.globalFather.addEventListener("mouseup", () => { this.mouseState = 'up'; });
        this.globalFather.addEventListener("mousemove", function (e) {
            /* Retrieve mouse coordinates when movement on the knob is detected */
            if (!scopePowerState) { return };
            _self.mouseX = e.clientX;
            _self.mouseY = e.clientY;
            _self.rotateKnob();

        });



    }

    /**
     * @param {string} _text
     */
    set text(_text) {
        if (this.textTarget != null) {
            this.textTarget.textContent = _text;
        }
    }


    /**
     * @param {number} _angle
     */
    set rotation(_angle) {
        this.angle = _angle;
        this.value = this.angle;

        if (this.textTarget != null) {
            if (this.overlayArray != null) {
                this.text = this.overlayArray[this.ticks];
            }
        }
        this.knob.style.transform = 'rotate(' + this.angle + 'deg)';
    }



    /* Retrieve x,y coordinates of the knob center */
    get centerX() {
        var rect = this.container.getBoundingClientRect();
        return rect.left + (rect.width / 2);
    }
    get centerY() {
        var rect = this.container.getBoundingClientRect();
        return rect.top + (rect.height / 2);
    }


    get knobWidth() { return this.knob.clientWidth; }
    get knobHeight() { return this.knob.clientHeight; }
    get knobOffsetTop() { return this.knob.offsetTop; }
    get knobOffsetLeft() { return this.knob.offsetLeft; }
    get containerOffsetLeft() { return this.container.offsetLeft; }
    get containerOffsetTop() { return this.container.offsetTop; }
    get fatherOffsetLeft() { return this.father.offsetLeft; }
    get fatherOffsetTop() { return this.father.offsetTop; }
    get globalFatherOffsetLeft() { return this.globalFather.offsetLeft; }
    get globalFatherOffsetTop() { return this.globalFather.offsetTop; }

    rotateKnob() {

        /* Rotate only if the click started on this knob */
        if (this.mouseState === 'up') { return };

        let _endX = this.mouseX;
        let _endY = this.mouseY;
        let _startX = this.centerX;
        let _startY = this.centerY;

        /* Angle calculations for the rotation */
        this.angle = Math.round((Math.atan2(_endY - _startY, _endX - _startX) * 180 / Math.PI));
        /* Offsets for the atan(x) which would go from -90deg to +90deg --> 0deg to 180deg */
        this.angle = this.angle + 90;
        /* It works */
        if (this.angle < 0) (this.angle = this.angle + 360);


        /* If there is no text overlay id associated with this knob, why bother writing something? */
        if (this.textTarget != null) {
            if (this.overlayArray != null) {
                this.text = this.overlayArray[this.ticks];
            }
        }


        /* If the new angle is different from the 'outside' angle, update it and play audio feedback */
        if (this.angle != this.value) {
            this.value = this.angle;
            this.knob.style.transform = 'rotate(' + this.angle + 'deg)';

            /* Avoid sound feedback being obnoxious */
            this.soundFlag++;
            if (this.soundFlag == 4) {
                this.soundFlag = 0;
                playSound('rotation_LPF', 0.50);
            }

        }

    }

}