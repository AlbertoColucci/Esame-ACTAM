class RotarySwitch {
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
        this.ticks = 0;

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
        this.knob.style.backgroundImage = "url('img/RotSwitchKnob.png')";
        this.knob.style.backgroundSize = 'cover';
        this.knob.style.display = 'inline-block';

        /* CSS Text Styling */
        this.textTarget.textContent = this.overlayArray[this.ticks];


        /*  Event sensitivity  */
        /* _self compensates the 'this' reference */
        var _self = this;
        this.knob.addEventListener('mousemove', function (e) {
            /* Retrieve mouse coordinates when movement on the knob is detected */
            if (!scopePowerState) { return };
            _self.mouseX = e.clientX;
            _self.mouseY = e.clientY;
            _self.rotateKnob();
        });
        this.knob.addEventListener('mouseup', () => { this.mouseState = 'up' });
        this.knob.addEventListener('mousedown', () => { this.mouseState = 'down' });

        this.father.addEventListener("mouseup", () => { this.mouseState = 'up' });

        this.globalFather.addEventListener("mouseup", () => { this.mouseState = 'up' });
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
    set text(_text) { this.textTarget.textContent = _text; }

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
    get steps() { return this.stepsArray.length; }

    rotateKnob() {

        /* Rotate only if the click started on this knob */
        if (this.mouseState === 'up') { return };

        let _steps = this.steps;
        let _endX = this.mouseX;
        let _endY = this.mouseY;
        let _startX = this.centerX;
        let _startY = this.centerY;

        /* Angle calculations for the rotation */
        let _angle = Math.round((Math.atan2(_endY - _startY, _endX - _startX) * 180 / Math.PI));
        /* Offsets for the atan(x) which would go from -90deg to +90deg --> 0deg to 180deg */
        _angle = _angle + 90;
        /* It works */
        if (_angle < 0) (_angle = _angle + 360);

        /* Angle snapped to the divisions of the knob */
        /* The final angle is the original angle / single_step, +0.25 to give half deadzone to both directions for the .round() */
        /* Then the number of steps is multiplied for the degrees-per-step to get the final knob angle */

        /* Compute the ticks */
        let _old_ticks = this.ticks;
        this.ticks = Math.round(_angle / (360 / (_steps - 1)) + 0.25);

        /* If the new angle is different from the 'outside' angle, update it and play audio feedback */
        if (_old_ticks != this.ticks) { playSound('knobClick', 0.60); }

        /* Update the angle based on the snapped tick */
        _angle = this.ticks * (360 / _steps);
        this.knob.style.transform = 'rotate(' + _angle + 'deg)';


        /* If there is no text overlay id associated with this knob, why bother writing something? */
        if (this.textTarget != null) {
            if (this.overlayArray != null) { this.text = this.overlayArray[this.ticks]; }
        }


    }

}