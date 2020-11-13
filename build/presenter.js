/**  
 * @module Presenter
 */
 var Presenter = Presenter || {};
 
(function(global) {
    "use strict";
    /**
     * @class Overview
     * @constructor
     */
    function Navigator(){}

    Navigator.actions = new Array();

    /**
     * @method init
     * @static
     */
    Navigator.init = function(){
        var channel = postal.channel("slides");
        channel.subscribe("navigator", Navigator.handle); 
    }

    /**
     * @method handle
     * @static
     */
    Navigator.handle = function(data){
        var action = data.action;
        console.log("[Navigator] Handling " + action); 
        Navigator.actions[action](); 
    }

    /**
     * @method register
     * @static
     */
    Navigator.register = function(key, action){
        console.log("[Navigator] " + key + " " + "registered."); 
        Navigator.actions[key] = action; 
    } 

    //Make constructor visible in global space. 
    global.Presenter.Navigator = Navigator;
}(window));
/**  
 * @module Presenter
 */
var Presenter = Presenter || {};

(function(namespace) {
    "use strict";

    /**
     * The Ticker indicates the number of steps (hidden elements) remaining on the current slide. 
     *
     * @class Ticker
     * @constructor
     * @param {SlideDeck} Reference to SlideDeck object. 
     */
    function Ticker(deck) {
        this.deck = deck;
    }

    /**
     * Removes all ticks.
     *
     * @method flush
     */
    Ticker.prototype.flush = function(){
        $("#ticks li").remove(); 
    }

    /**
     * Renew the ticker count so that it matches the current number of steps remaining. 
     * 
     * @method renew
     */
    Ticker.prototype.renew = function() {
        var nSteps = this.deck.getCurrentSlide().querySelectorAll(".step").length;
        var nTicks = document.getElementById("ticks").childNodes.length; 
        var deltaSteps = Math.abs(nSteps - nTicks); 

        //Determine wether to increase or decrease in order to match the correct number of ticks. 
        var callback; 
        if(nTicks < nSteps){
            callback = this.increase; 
        }
        else if(nTicks > nSteps){
            callback = this.decrease;
        }
        else{
            return; 
        }
        
        for(var i = 0; i < deltaSteps; i++){
            callback.apply(this);  
        }
    };

    /**
     * Set Ticker to a specific count. 
     * 
     * @method set
     */
    Ticker.prototype.set = function(nSteps) {
        this.flush(); 
        for(var i = 0; i < nSteps; i++){
            this.increase();   
        }
    };
        
    /**
     * Decreases the ticker-count by one tick. 
     * 
     * @method decrease
     */
    Ticker.prototype.decrease = function() {
        var $lastChild = $("#ticks li").not(".hidden").last(); 
        $lastChild.addClass("hidden"); 
        $lastChild.hide(
                'fast', 
                function(){ 
                    $lastChild.remove(); 
                }
        );
    };

    /**
     * Increases the ticker-count by one tick.
     * 
     * @method increase
     */
    Ticker.prototype.increase = function() {
        $("#ticks").append(
            $("<li />").append(
                $("<span />").attr("class", "tick")
            )
        ); 
    };
    
    //Make constructor visible in module. 
    namespace.Ticker = Ticker;
}(Presenter));
/**  
 * @module Presenter
 */
var Presenter = Presenter || {};

(function(namespace) {
    "use strict";
    /**
     * Controls the visibility and transitions of steps. 
     *
     *  Example Usage
     *  <section>
     *      <ul>
     *          <li class="step" data-step-group="1"></li>
     *          <li class="step" data-step-group="1"></li>
     *          <li class="step" data-step-group="2"></li>
     *          <li class="step"></li>
     *  </section>
     * 
     * @class StepManager
     * @constructor
     * @param {SlideDeck} Reference to the SlideDeck object. 
     */
    function StepManager(deck) {
        this.deck = deck; 
        this.groups = [];
        this.current = -1;
         
        var channel = postal.channel("slides");
        channel.subscribe("slide-changed", this.reset).withContext(this);
    }

    StepManager.prototype.setData = function(){
        if(this.current < 0 || this.current >= this.groups.length){
            this.deck.getCurrentSlide().dataset.currentGroup = null; 
        }
        else{
            this.deck.getCurrentSlide().dataset.currentGroup = this.groups[this.current].name; 
        }
    }
 
    /**
     * Shows the next step on the current slide.
     * 
     * @method nextStep
     */
     StepManager.prototype.nextStep = function() {
        if(this.current >= 0 && this.current < this.groups.length){
            $(this.groups[this.current].steps).removeClass("current-step");
        }   

        if(this.current < this.groups.length-1){
            this.current++;
            this.deck.ticker.decrease();
            
            $(this.groups[this.current].steps).removeClass("step");
            $(this.groups[this.current].steps).addClass("current-step");
            $(this.groups[this.current].steps).addClass("step-done");
        }

        this.setData(); 
    };

    /** 
     * Hides the last visible step on the current slide. 
     * 
     * @method previousStep
     */
    StepManager.prototype.previousStep = function() {
        if(this.current >= 0 && this.current < this.groups.length){
            $(this.groups[this.current].steps).removeClass("current-step");
            $(this.groups[this.current].steps).removeClass("step-done");
            $(this.groups[this.current].steps).addClass("step"); 

            this.current--;
            this.deck.ticker.increase();
            
            if(this.current >= 0){
                $(this.groups[this.current].steps).addClass("current-step");
            }
        }
        this.setData(); 
    };

    /**
     * 
     * @method reset
     */
    StepManager.prototype.reset = function(){
        var steps = this.deck.getCurrentSlide().querySelectorAll(".step, .step-done");
        this.groups = [];
        this.current = -1;
        
        for(var i=0; i< steps.length; i++){
            var step = steps[i];
            var group = step.dataset.stepGroup; //data-step-group = dataset.stepGroup!!!
            var index;
            
            if(typeof group != 'undefined'){
                var found = false;
                var searchIndex = 0;
                while(!found && searchIndex < this.groups.length){
                    if(this.groups[searchIndex].name == group){
                        var new_group = this.groups[searchIndex];
                        new_group.steps.push(step);
                        index = searchIndex; 
                        found = true; 
                    }
                    else{
                        searchIndex++; 
                    }
                }

                if(!found){
                    var new_group = {};
                    new_group.name = group;
                    new_group.steps = [];
                    new_group.steps[0]= step;
                    this.groups.push(new_group);
                    index = this.groups.length-1; 
                }
            }
            else{
                var new_group = {};
                new_group.name = null;  
                new_group.steps = [];
                new_group.steps[0] = step; 
                this.groups.push(new_group);
                index = this.groups.length-1; 
            }

            if($(step).hasClass("current-step")){
                this.current = index; 
            }
        }

        this.deck.ticker.set(this.groups.length-(this.current+1));
        this.setData(); 
    };
        
    namespace.StepManager = StepManager;
}(Presenter));
/**  
 * @module Presenter
 * @author Vincent Ceulemans
 */
var Presenter = Presenter || {};

(function(global) {
    "use strict";
    /**
     * SlideDeck
     *  
     * @class SlideDeck
     * @constructor
     * @param {array} slides List of slides in the deck.
     * @param {int} currentSlide The first slide to show. (Starts at 1)
     */
    function SlideDeck(slides, currentSlide) {
        this.slides = slides;
        this.nSlides = this.slides.length;
        this.currentSlide = currentSlide;
        this.pointer = false;
        this.ticker = new global.Presenter.Ticker(this); 
        this.stepManager = new global.Presenter.StepManager(this);
    
        this.initProgressBar();
        this.initVideos(); 
        
        this.channel = postal.channel("slides");

        /*Actions done before slide changes*/
        this.channel.subscribe("pre-slide-changed", this.autoStopVideo).withContext(this);
        this.channel.subscribe("enter-overview", this.autoStopVideo).withContext(this);

        /*Actions for new slide*/
        this.channel.subscribe("slide-changed", this.updateLocationHash).withContext(this);
        this.channel.subscribe("slide-changed", this.updateProgressBar).withContext(this);

        this.channel.subscribe("slide-changed", this.refreshNotes).withContext(this);
        this.channel.subscribe("slide-changed", this.autoPlayVideo).withContext(this);

        this.channel.subscribe("slide-changed", this.SlideInit).withContext(this);
        this.channel.subscribe("pre-slide-changed", this.SlideDestroy).withContext(this);
    }

    /*Static*/
    SlideDeck.SLIDE_STATES = [
        "farPastSlide", 
        "pastSlide", 
        "currentSlide", 
        "futureSlide", 
        "farFutureSlide"
    ];

    /*
     Private functions
     */
    function toggleVideo(e) {
        var video = e.target; 
        if(video.paused){
            video.play();
        }
        else{
            video.pause();
        }
    }

    //Public Functions
    SlideDeck.prototype.SlideInit = function(){
        var init = $(this.getCurrentSlide()).attr("init");
        if(typeof init != 'undefined'){
            window[init]();//init
        }
    }

    SlideDeck.prototype.SlideDestroy = function(){
        var destroy = $(this.getCurrentSlide()).attr("destroy");
        if(typeof destroy != 'undefined'){
            window[destroy]();
        }
    }
    
    /**
     * Update URL in the adressbar to the current position in the slidedeck.  
     * 
     * @method updateLocationHash
     */
    SlideDeck.prototype.updateLocationHash = function() {
        global.location.hash = "#" + this.currentSlide;
    };

    /**
     * Update progressbar.
     *
     * @method updateProgressBar
     */
    SlideDeck.prototype.updateProgressBar = function(){
        var progressPercentage = this.currentSlide/this.nSlides*100; //Decrease by a small amount so that the variable doesn't become 1.0, as that would make the bar disappear.
        progressJs().set(progressPercentage); //Decrease the progressbar with 1% once every 0.01 * interval. 
    }

    SlideDeck.prototype.initProgressBar = function(){
        progressJs().start(); 
    };

    /**
     * Returns the slide object for the given slide number. 
     * 
     * @method getSlide
     * @param {int} slideNumber
     * @return {htmlelement} The corresponding slide. 
     */
    SlideDeck.prototype.getSlide = function(slideNumber) {
        return this.slides[slideNumber - 1];
    };

    /**
     * Returns the current slide. 
     * 
     * @method getCurrentSlide
     * @return {htmlelement} The current slide.
     */
    SlideDeck.prototype.getCurrentSlide = function() {
        return this.getSlide(this.currentSlide);
    };

    /**
     * Returns the sequence number of the given slide. 
     * 
     * @method getSlideNmb
     * @return {int} The sequence number.
     */
    SlideDeck.prototype.getSlideNmb = function(slide) {
        var found = false; 
        var i = 0;
        while (i < this.slides.length && found === false) {
            if (this.slides[i] === slide) {
                found = true;
            } 
            else {
                i++;
            }
        }
        return (i + 1);
    };

    /**
     * Go to next item (Slide or step)
     * 
     * Go to the next step if there are remaining steps on the current slide.
     * If no steps remain, then the next slide is shown.
     * 
     * @method next
     */
    SlideDeck.prototype.next = function() {
        var nSteps = this.getCurrentSlide().querySelectorAll(".step").length;
        if (nSteps != 0)
        {
            this.stepManager.nextStep();
            this.channel.publish("step-changed", {type: "next"});
        }
        else if(this.currentSlide+1 <= this.nSlides)
        {
            this.channel.publish("pre-slide-changed");
            this.nextSlide();
            this.channel.publish("slide-changed", {type: "next", slide: this.currentSlide});
        }
    };

    /**
     * Go to previous item (Slide or step)
     *
     * Go to the previous slide if no steps are visible on the current slide, otherwise the previous step is shown.
     * 
     * @method previous
     */
    SlideDeck.prototype.previous = function() {
        var nSteps = this.getCurrentSlide().querySelectorAll(".step-done").length;
        if (nSteps >= 1) {
            this.stepManager.previousStep();
            this.channel.publish("step-changed", {type: "previous"});
        } else {
            this.channel.publish("pre-slide-changed");
            this.previousSlide();
            this.channel.publish("slide-changed", {type: "previous" , slide: this.currentSlide});
        }
    };
    
    /**
     * Goto to the specified Slide using the Id of the slide. 
     * 
     * @method gotoById 
     * @param {string} id Id of the slide. 
     */
    SlideDeck.prototype.gotoById = function(id) {
        this.channel.publish("pre-slide-changed");
        var n = this.currentSlide - 2;
        for (var i = 0; i < this.SLIDE_STATES.length; i++, n++) {
            this.clear(n);
        }

        var slideN = this.getSlideNmb(document.getElementById(id));
        this.currentSlide = slideN;
        slideN -= 2;
        for (var i = 0; i < this.SLIDE_STATES.length; i++, slideN++) {
            this.updateSlide(slideN, this.SLIDE_STATES[i]);
        }
        this.channel.publish("slide-changed", {type: "goto", slide: this.currentSlide});
    };
    
    /**
     * Goto to the specified Slide using the slide number. 
     * 
     * @method gotoByNumber 
     * @param {int} n The number/order of the slide in the slidedeck. 
     */
    SlideDeck.prototype.gotoByNumber = function(n){
        this.currentSlide = n; 
        var t = 0;
        for (var i = this.currentSlide - 2; i <= this.currentSlide + 2; i++, t++) {
            this.updateSlide(i, Presenter.SlideDeck.SLIDE_STATES[t]);
        }
        this.channel.publish("slide-changed", {type: "goto", slide: this.currentSlide});
    };

    /**
     * Go to next slide.
     * 
     * @method nextSlide
     */
    SlideDeck.prototype.nextSlide = function() {
        if (this.currentSlide < this.nSlides) {
            //Update slides to new state.
            var slideN = this.currentSlide - 2;
            if (this.getSlide(slideN)) {
                this.clear(slideN); 
            }

            slideN++;
            for (var i = 0; i < SlideDeck.SLIDE_STATES.length; i++, slideN++) {
                this.updateSlide(slideN, SlideDeck.SLIDE_STATES[i]);
            }

            this.currentSlide++;        
        }
    };

    /**
     * Go to previous slide.
     * 
     * @method previousSlide
     */
    SlideDeck.prototype.previousSlide = function() {
        if (this.currentSlide > 1) {
            var slideN = this.currentSlide - 3;
            for (var i = 0; i < SlideDeck.SLIDE_STATES.length; i++, slideN++) {
                this.updateSlide(slideN, SlideDeck.SLIDE_STATES[i]);
            }
            if (this.getSlide(slideN)) {
                this.clear(slideN);
            }
            slideN++;
            this.currentSlide--;
        }
    };
  
    /**
     * Update notes for current slide.
     *
     * Reloads the notes stored within div.notes into the notes display. 
     * 
     * @method refreshNotes
     */
    SlideDeck.prototype.refreshNotes = function() {
        //Remove any content that was previously present in the notes-display. 
        $("#notes-display").html("");
        
        var currentSlide = this.getCurrentSlide();
        if (currentSlide.querySelectorAll(".notes")[0]) {
            var notes = currentSlide.querySelectorAll(".notes")[0];
            $("#notes-display").html(notes.innerHTML);
        }
    };

    /**
     * Automatically start playing the video on the current slide, when present. 
     * 
     * @method autoPlayVideo
     */
    SlideDeck.prototype.autoPlayVideo = function() {
        var currentSlide = this.getCurrentSlide();
        if (currentSlide.classList.contains("video") && currentSlide.querySelector("video") !== null) {
            currentSlide.querySelector("video").play(); 
        }
    };

    /**
     * Automatically stop playing the video on the current slide, when present. 
     * 
     * @method autoStopVideo
     */
    SlideDeck.prototype.autoStopVideo = function() {
        //If the current slide has a video, stop playing the video.
        var currentSlide = this.getCurrentSlide();
        if (currentSlide.classList.contains("video") && currentSlide.querySelector("video") !== null) {
            currentSlide.querySelector("video").pause(); 
        }
    };

    /**
     * Update the slide with the given state.
     *
     * @method updateSlide
     * @param {int} slideNumber between 1 and slides.length
     * @param {String} stateName New state of the slide (one of SLIDE_STATES)
     */
    SlideDeck.prototype.updateSlide = function(slideNumber, stateName) {
        if (slideNumber > 0 && slideNumber <= this.slides.length) {
            var slide = this.getSlide(slideNumber);
            for (var i = 0; i < SlideDeck.SLIDE_STATES.length; i++) {
                slide.classList.remove(SlideDeck.SLIDE_STATES[i]);
            }
            slide.classList.add(stateName);
        }
    };

    /**
     * Remove all states from the slide.
     *
     * @method clear
     * @param {int} slideNumber Number of the Slide
     */
    SlideDeck.prototype.clear = function(slideNumber) {
        if (slideNumber > 0 && slideNumber <= this.slides.length) {
            var slide = this.getSlide(slideNumber);
            for (var i = 0; i < SlideDeck.SLIDE_STATES.length; i++) {
                slide.classList.remove(SlideDeck.SLIDE_STATES[i]);
            }
        }
    };

    /**
     * Toggles the visibility of the mouse cursor.  
     * 
     * @method togglePointer
     */
    SlideDeck.prototype.togglePointer = function() {
        this.pointer = !this.pointer;
        document.body.classList.toggle("cursor-visible");
    };

    SlideDeck.prototype.showPointer = function() {
        this.pointer = true; 
        document.body.classList.add("cursor-visible");
    };

    SlideDeck.prototype.hidePointer = function() {
        this.pointer = false; 
        document.body.classList.remove("cursor-visible");
    };

    /*
     * Handle video start playing and pausing events.
     * Use the click event of the video element to provide support for 'clicking on video and playing',
     * as opposed to aiming for the tiny play button.
     */

    /**
     * Adds an eventhandler to each video in the presentation, as such ensuring that they are played when clicked.
     * 
     * @method initVideos
     */
    SlideDeck.prototype.initVideos = function() {
        var videos = document.getElementsByTagName('video');
        for (var i = 0; i < videos.length; i++) {
            videos[i].addEventListener('click', toggleVideo, false);
        }
    };
    
    /**
     * Return the appropriate CSS-transform for the scaling of screen. 
     * 
     * @method scale
     * @param {number} scale
     */
    SlideDeck.prototype.scale = function (scale){
        return "scale3d(" + scale + "," + scale + ",1)";
    };

    //Make constructor visible in global space. 
    global.Presenter.SlideDeck = SlideDeck;
}(window));

//Register Actions
Presenter.Navigator.register("next",
    function(){
        Presenter.deck.next(); 
    }
);
Presenter.Navigator.register("previous",
    function(){
        Presenter.deck.previous(); 
    }
);

Presenter.Navigator.register("toggle_pointer",
    function(){ 
        Presenter.deck.togglePointer();
    }
);

Presenter.Navigator.register("pointer.show",
    function(){ 
        Presenter.deck.showPointer();
    }
); 

Presenter.Navigator.register("pointer.hide", 
    function(){ 
        Presenter.deck.hidePointer();
    }
);

Presenter.Navigator.register("toggle_notes",
    function(){
         $("#notes-display").toggleClass("visible");
    }
);

Presenter.Navigator.register("hide_notes",
    function(){
        $("#notes-display").removeClass("visible");
    }
);

Presenter.Navigator.register("show_notes",
    function(){
        $("#notes-display").addClass("visible");
    }
);
/**  
 * @module Presenter
 */
 var Presenter = Presenter || {};
 
(function(global) {
    "use strict";
    /**
     * @class Keyboard
     * @constructor
     */
    function Keyboard(){
       this.enable(); 
    }

    Keyboard.map = {
        13: "next", //Enter-key
        39: "next", //Right Arrow-key
        34: "next", //Page-Down
        32: "next", //Space-Bar

        33: "previous", //Page-Up
        37: "previous", //Left Arrow-key
        
        79: "overview", //"o" Overview
        80: "toggle_pointer", //"p" Pointer
        87: "curtain.toggle.white", //w
        66: "curtain.toggle.black", //b
        78: "toggle_notes", //n
        77: "sync.master",  //"m"
        76: "sync.listen"//"l"
    };

    Keyboard.prototype.enable = function()
    {
        $(document).on("keydown", this.handle);
    }; 

    Keyboard.prototype.disable = function()
    {
        $(document).off("keydown", this.handle);
    };

    /**
     * @method handle
     */
    Keyboard.prototype.handle = function(event)
    {
        var channel = postal.channel("slides");
        var keyCode = event.keyCode;
        if (Keyboard.map.hasOwnProperty(keyCode)) {
            event.preventDefault();
            console.log(Keyboard.map[keyCode]);
            channel.publish("navigator", {action: Keyboard.map[keyCode]});
        }
        else{
            console.info("[Keyboard] Keycode '" + keyCode + "' has no action attached."); 
        }
    }; 

    //Make constructor visible in global space. 
    global.Presenter.Keyboard = Keyboard;
}(window));
/**  
 * @module Presenter
 */
 var Presenter = Presenter || {};
 
(function(global) {
    "use strict";
    /**
     * @class Mouse
     * @constructor
     */
    function Mouse(){
       this.enable();
    }
    
    Mouse.prototype.enable = function()
    {
        console.log("[Mouse] Enabled");

        if (window.addEventListener) {    // all browsers except IE before version 9
            // Internet Explorer, Opera, Google Chrome and Safari
            document.querySelector(".slideDeck").addEventListener("mousewheel",
                                                                  this.handleMouseWheel,
                                                                  false);
            
            // Firefox
            // Scroll information is stored in e.detail. Is '3' for scrollDown and '-3' for scrollUp. 
            document.querySelector(".slideDeck").addEventListener("DOMMouseScroll",
                                                                  this.handleDOMMouseScroll,
                                                                  false);
        }
    };

    Mouse.prototype.handleMouseWheel = function(e){
        console.debug("mousewheel");
        Mouse.scrollHandler(e.wheelDelta);
    }

    Mouse.prototype.handleDOMMouseScroll = function(e){
        console.debug("DOMMouseScroll");
        Mouse.scrollHandler(-e.detail);
    }

    /**
     * @param wheelData Negative number on scrollUp, positive number on scrollDown. 
     */ 
    Mouse.scrollHandler = function(wheelDelta){
        var action = ""; 
        if(wheelDelta < 0){
            action = "next"; 
        }
        else{
            action = "previous"
        }
        
        global.postal.channel("slides").publish("navigator", {action: action});
    }

    Mouse.prototype.disable = function()
    {
        console.log("[Mouse] Disabled");
        document.querySelector(".slideDeck").removeEventListener("mousewheel", this.handleMouseWheel);
        document.querySelector(".slideDeck").removeEventListener("DOMMouseScroll",  this.handleDOMMouseScroll);
    };

    //Make constructor visible in global space. 
    global.Presenter.Mouse = Mouse; 
}(window));
/**  
 * @module Presenter
 */
 var Presenter = Presenter || {};
 
(function(namespace, window) {
    "use strict";
    var PREFIX = Presenter.PREFIX = ["-webkit-", "-moz-", "-o-", ""];
    var deck;
    var SLIDE_TRANSFORMS = {};

    /**
     * Starts the presentation. 
     * 
     * @method init
     * @param {object} config Configuration object
     */
    function init(config) {
        Presenter.settings = config;
        
        //Hook up eventhandlers.
        $(window).on("resize", Presenter.onWindowResized);

        if(typeof Hammer != 'undefined'){
            Presenter.Touch.enable();
        }
        Presenter.keyboard = new Presenter.Keyboard();
        Presenter.mouse = new Presenter.Mouse(); 
            
        addExtraHTMLElements(); 
        createDeck(); 
        Presenter.onWindowResized();
       
        //Overview
        if(typeof Presenter.Overview != 'undefined'){
            Presenter.overview = new Presenter.Overview(deck);        
        }
        
        Presenter.Navigator.init(); 
        window.postal.channel("slides").publish("slide-changed");
    }

    /**
     * Adds needed HTML markup to the DOM. 
     *
     *  @method addExtraHTMLElements
     */
    function addExtraHTMLElements(){
        //Add necessary divs
        $("body")
                .append($("<div/>").attr("id", "curtain"))
                .append($("<div/>").attr("id", "notes-display"))
                .append(
                    $("<div/>")
                        .attr("id", "ticker")
                        .attr("class", Presenter.settings["ticker-position"])
                        .append(
                            $("<ul/>")
                            .attr("id", "ticks")
                        )
                );

        //Add the "slide" class to each section. 
        $(".slideDeck > section").addClass("slide");
    }
    
    /**
     * Create an initialize a new deck object
     *
     * @method createDeck
     */
    function createDeck(){
        //Check for slide number in location.hash
        var currentSlide;
        if (location.hash === "") {
            location.hash = "#1";
            currentSlide = 1;
        }
        else {
            var slideNumber = location.hash.substring(1); //location.hash is of the form "#number". Start from position 1 so the "#" is ignored.
            currentSlide = parseInt(slideNumber);
        }
        
        deck = Presenter.deck = new Presenter.SlideDeck(document.querySelectorAll(".slide"), currentSlide);
        var computedStyle = document.defaultView.getComputedStyle(deck.slides[0], ""); 
        deck.slideWidth = parseInt(computedStyle.getPropertyValue("width"));
        deck.slideHeight = parseInt(computedStyle.getPropertyValue("height"));

        var t = deck.currentSlide - 2;
        for (var i = 0; i < Presenter.SlideDeck.SLIDE_STATES.length; i++, t++) {
            if (t > 0 && t <= deck.nSlides) {
                deck.getSlide(t).classList.add(Presenter.SlideDeck.SLIDE_STATES[i]);
            }
            
            //Store Original Transformation
            //Add dummy slide to DOM to get the style associated. 
            $("body").append(
                $("<div/>")
                        .attr("class", Presenter.SlideDeck.SLIDE_STATES[i])
                        .attr("id", "test")
            );             
            
            var slide_style; 
            if( $("#test").css('transform')){
                slide_style =  $("#test").css('transform'); 
            }
            else{
                slide_style = $("#test").css('-webkit-transform'); 
            }

            SLIDE_TRANSFORMS[Presenter.SlideDeck.SLIDE_STATES[i]] = slide_style;

            //Remove Dummy. 
            $("#test").remove(); 
        }
    }
    
    /**
     * Resizes slidedeck when window is resized. 
     * 
     * @method windowResizedHandler
     */
    Presenter.onWindowResized = function(){
        var styles = "@media screen{\n";
        var scale = Math.min(window.innerHeight / deck.slideHeight, window.innerWidth / deck.slideWidth);

        if(Presenter.settings.hasOwnProperty("scale")){
            scale *= Presenter.settings.scale; 
        }
        
        var offsetLeft = (window.innerWidth - deck.slideWidth * scale) / 2.0;
        var offsetTop = (window.innerHeight - deck.slideHeight * scale) / 2.0;
        
        for (var i = 0; i < Presenter.SlideDeck.SLIDE_STATES.length; i++) {
            styles += "." + Presenter.SlideDeck.SLIDE_STATES[i] + "{\n";
            for (var j = 0; j < PREFIX.length; j++) {
                styles += PREFIX[j] + "transform:"+ deck.scale(scale) + " ";
                styles += SLIDE_TRANSFORMS[Presenter.SlideDeck.SLIDE_STATES[i]] +";\n";
            }
            styles += "left:" + offsetLeft + "px;\n";
            styles += "top: " + offsetTop + "px;\n";
            styles += "}\n";
        }
        styles+="\n"; 
        $("#style").html(styles); 
    }

    Presenter.disableTransitions = function(){
        var styles = "";
        
        for (var i = 0; i < Presenter.SlideDeck.SLIDE_STATES.length; i++) {
            styles += "." + Presenter.SlideDeck.SLIDE_STATES[i] + "{\n";
            for (var j = 0; j < PREFIX.length; j++) {
                styles += PREFIX[j] + "transform: none;\n";
                styles += PREFIX[j] + "transition: all 0s;\n";
            }
            styles += "}\n";
        }
        $("#style").html(styles); 
    }
    
    window.Presenter.init = init;
}(Presenter, window));
/**  
 * @module Presenter
 * @author Vincent Ceulemans
 */
 var Presenter = Presenter || {};
 
(function(global) {
    "use strict";
    /**
     * @class Curtain
     * @constructor
     */
    function Curtain(){}

    /**
     * Indicate state of curtain:
     * True = Curtain Active
     * False = Curtain Hidden
     *
     * @property active
     * @static
     */
    Curtain.active = false; 
    
    /**
     * Toggles a blank screen with the given color.
     * 
     * @method toggle
     * @static
     * @param {String} color Color of the curtain. 
     */
    Curtain.toggle = function(color) {
        if (Curtain.active === false) {
            //Close
            $("#curtain").addClass("closed");
            $("#curtain").css("background", color);
        }
        else {
            //Open
            $("#curtain").removeClass("closed");
        }
        Curtain.active = !Curtain.active; //Toggle value. 
    }

    //Make constructor visible in global space. 
    global.Presenter.Curtain = Curtain;
}(window));

//Register Actions with the navigator. 
Presenter.Navigator.register("curtain.toggle.white",
    function() {
        Presenter.Curtain.toggle("#FFF");
    }
);

Presenter.Navigator.register("curtain.toggle.black",
    function() {
        Presenter.Curtain.toggle("#000");
    }
);
/**  
 * @module Presenter
 */
 var Presenter = Presenter || {};
 
(function(global) {
    "use strict";
    /**
     * @class Touch
     * @constructor
     */
    function Touch(){
    }

    /**
     * Register Touch Events with Hammer.js.  
     * 
     * @method enable
     * @static
     */
    Touch.enable = function(){
        var channel = postal.channel("slides");
        var slideDeck = document.getElementById("slidedeck"); 

        //Tap
        Hammer(slideDeck).on("tap", function() {
            channel.publish("navigator", {action:"next"});
        });
        
        //SwipeLeft
        Hammer(slideDeck).on("swipeleft", function() {
            channel.publish("navigator", {action:"next"});
        });
        
        //SwipeRight
        Hammer(slideDeck).on("swiperight", function() {
            channel.publish("navigator", {action:"previous"});
        });
        
        //SwipeUp
        Hammer(slideDeck).on("swipeup", function() {
            channel.publish("navigator", {action:"show_notes"});
        });
        
        //SwipeDown 
        Hammer(slideDeck).on("swipedown", function() {
            channel.publish("navigator", {action:"hide_notes"});
        });
        
        //Hold
        Hammer(slideDeck).on("hold", function() {
            channel.publish("navigator", {action:"overview"});
        });
    }
   
    //Make constructor visible in global space. 
    global.Presenter.Touch = Touch;
}(window));
/**  
 * @module Presenter
 */
 var Presenter = Presenter || {};
 
(function(global) {
    "use strict";
    /**
     * @class Overview
     * @constructor
     */
    function Overview(deck){
        this.active = false;
        this.deck = deck;
    }

    /**
     * Toggles overview mode of the sliddedeck where
     * all slides are displayed in a table as thumbnails. 
     * 
     * @method toggle
     */
    Overview.prototype.toggle = function(){
        if (this.active)
        {
            this.hide();
        }
        else
        {
            this.show();
        }
    }

    var PREFIX = Presenter.PREFIX; 

    /**
     *  @method show 
     */
    Overview.prototype.show = function() {
        this.active = true;  
        var deck = this.deck;
        var settings = Presenter.settings;
        var channel = window.postal.channel("slides");

        Presenter.mouse.disable(); 

        //Announce change
        channel.publish("enter-overview");
       
        //Show cursor so user can click on thumbnails. 
        channel.publish("navigator", {action:"pointer.show"});
        
        //Determine height of the tumbnails. 
        var thumbnailHeight = (deck.slideHeight / deck.slideWidth) * settings.thumbnail_width; //aspect-ratio * thumbnail_width
        var scale = settings.thumbnail_width / deck.slideWidth;

        //Replace current styles.
        Presenter.disableTransitions(); 

        //Wrap each slide in another div. Used for layout purposes in overview mode. 
        $(deck.slides).wrap('<div class="slide-wrapper"/>');
         
        var style = ".slide-wrapper{width:" + settings.thumbnail_width + "px;"
                + "height:" + (thumbnailHeight) + "px;}\n"
                + ".slideDeck.overview .slide-wrapper .slide"
                + "{\n";
        for (var i = 0; i < PREFIX.length; i++) {
            style += PREFIX[i] + "transform: scale(" + scale + ");\n";
        }
        
        style += "}";
        
        $("#style").append(style);  
        $(window).off("resize");

        $(".slideDeck")
                .addClass("overview")
                .on("click", ".slide",
                    $.proxy(this.onSelectSlide, this)
                );
        var currentSlide = deck.getCurrentSlide();
        //Indicate the current slide with a different style in the overview. 
        currentSlide.parentNode.classList.add("current");
        //Remove Slide-states from the active slides 
        for (var i = deck.currentSlide - 2; i <= deck.currentSlide + 2; i++) {
            deck.clear(i);
        }

        //Scroll to the current slide. 
        currentSlide.scrollIntoView();
    }

    /**
     * @method hide
     */ 
    Overview.prototype.hide = function() {
        this.active = false; 
        var deck = this.deck;
        var settings = Presenter.settings;
        var channel = window.postal.channel("slides");

        Presenter.mouse.enable(); 

        channel.publish("navigator", {action:"pointer.hide"});

        $(".slideDeck")
                .removeClass("overview")
                .off("click", ".slide", this.onSelectSlide);

        $(".slideDeck > .slide-wrapper.current").removeClass("current");

        $(deck.slides).unwrap(); 
        
        var t = 0;
        for (var i = deck.currentSlide - 2; i <= deck.currentSlide + 2; i++, t++) {
            deck.updateSlide(i, Presenter.SlideDeck.SLIDE_STATES[t]);
        }

        $(window).on("resize", Presenter.onWindowResized);
        $(window).trigger('resize');
        channel.publish("slide-changed");
    }

    /**
     * Event Handler for clicking on a slide in overview-mode. 
     * 
     * @method onSelectSlide
     * @param event
     */
    Overview.prototype.onSelectSlide = function(event) {
        var target = event.currentTarget;
        this.deck.gotoByNumber(this.deck.getSlideNmb(target)); 
        this.hide(); 
    }

    //Make constructor visible in global space. 
    global.Presenter.Overview = Overview;
}(window));

Presenter.Navigator.register("overview",
    function(){
        Presenter.overview.toggle(); 
    }
);

/**  
 * @module Presenter
 */
 var Presenter = Presenter || {};
 
(function(global) {
    "use strict";
    /**
     * Client side functions for synchronizing slide progress with sync_server.
     *
     * @class SyncClient
     * @constructor
     */
    function SyncClient(){}
    
    /**
     * Register this instance of the presentation as master. 
     * 
     * In master mode the input commands (changing slides) are transmitted 
     * via WebSockets to the sync-server and relayed 
     * to the registered listeners. 
     * 
     * @method master
     * @static
     */
    SyncClient.master = function() {
        var url = prompt("URL", "");
        
        try{
            var connection = new WebSocket('ws://' + url); //Example: ws://localhost:8080
        }
        catch(exception)
        {
            alert('WebSocket Error ' + exception); 
            console.log('WebSocket Error ' + exception);
            return; 
        }
            
        $('body').addClass("master");  
        $("#ticker").hide(); 
        connection.onerror = function(error) {
            alert('WebSocket Error ' + error); 
            console.log('WebSocket Error ' + error);
        };
        
        window.postal.channel("slides").subscribe("navigator",
            function(data) {
                connection.send(data.action);
            }
        ).withContext(this);
    };
    
    /**
     * Register this instance of the presentation as listener. 
     * Listens to incomming commands via WebSockets 
     * and updates this instance accordingly. 
     * Use this in combination with putInMasterMode
     * 
     * @method listen
     * @static
     */
    SyncClient.listen = function() {
        var url = prompt("URL", "");
        
        try{
            var connection = new WebSocket('ws://' + url);// ex. ws://localhost:8080
        }
        catch(exception)
        {
            alert('WebSocket Error ' + exception); 
            console.error('[SyncClient] WebSocket Error ' + exception);
            return; 
        }
        
        $("#ticker").hide(); 
        
        connection.onerror = function(error) {
            alert('WebSocket Error ' + error); 
            console.error('[SyncClient] WebSocket Error ' + error);
        };

        connection.onmessage = function(e) {
            window.postal.channel("slides").publish("navigator", {action: e.data});
            console.error('[SyncClient] Server: ' + e.data);
        };
    };

    //Make constructor visible in global space. 
    global.Presenter.SyncClient = SyncClient;
}(window));

Presenter.Navigator.register("sync.master",
    function()
    {
            Presenter.SyncClient.master(); 
    }
);

Presenter.Navigator.register("sync.listen",
    function()
    {
        Presenter.SyncClient.listen(); 
    }
);
