import Vex from 'vexflow';

import ElementAddedEvent from './events/elementAddedEvent';
import ElementReadyEvent from './events/elementReadyEvent';
import StaveAddedEvent from './events/staveAddedEvent';
import GetPrevClefEvent from './events/getPrevClefEvent';

/**
 * Implements the `vf-score` web component, which acts as the container for
 * the entire component. `vf-score`'s shadow root holds the HTML element that
 * the renderer renders too. 
 * 
 * All actual drawing is called from `vf-score`. 
 */
export class VFScore extends HTMLElement {
  /**
   * The Factory instance to be used by the overall component that this vf-score
   * wraps.
   */
  vf;

  /**
   * The Registry instance to be used by the overall component that this 
   * vf-score wraps.
   */
  registry;

  /**
   * The Renderer instance, attached to the div or canvas element that this
   * vf-score component renders into.
   * @private
   */
  _renderer;

  /**
   * The renderer context. 
   * @private
   */
  _context;

  /**
   * The starting x position of a system within the score.
   * @private
   */
  _startX = 10;

  /**
   * The starting y position of system within the score. 
   * @private
   */
  _startY = 0;

  /**
   * The entire width of the element holding the music notation.
   * @private  
   */
  _width = 500;

  /**
   * The entire height of the element holding the music notation.
   * @private
   */
  _height; 

  /**
   * The number of systems per line.  
   * @private
   */
  _systemsPerLine = 1;

  /**
   * Counter that keeps track of how many systems have dispatched events 
   * signalling that they are ready to be drawn. When the number of children 
   * matches this counter, the entire score is ready to be drawn.
   * FOR THIS PR: a vf-score can only have one vf-system. 
   * @private
   */
  _systemsAdded = 0;   

  /** 
   * The type of renderer to use for this vf-score component.
   * @private
   */
  _rendererType = 'svg';

  /**
   * Boolean describing whether the VexFlow renderer, context, registry, and 
   * factory instances have been created already. 
   * @private
   */
  _isSetup = false;

  constructor() {
    super();

    this.attachShadow({ mode:'open' });

    // The 'vf-system-ready' event is dispatched by a vf-systen when it has 
    // finished creating and adding its staves. vf-score listens to this event 
    // so that it can add that it can detect when the vf-system is ready to 
    // be drawn.
    this.addEventListener(ElementReadyEvent.systemReadyEventName, this._systemCreated);

    // The 'vf-element-added' event is dispatched by all the child elements 
    // when they are added to the DOM. vf-score listens to these events so that 
    // it can set the child elements' Factory instances, since these are shared 
    // by a vf-score and all its children to maintain the same render queue. 
    this.addEventListener(ElementAddedEvent.eventName, this._setFactory);

    // The 'vf-stave-added' event is dispatched only by the vf-stave child. 
    this.addEventListener(StaveAddedEvent.eventName, this._setRegistry);

    // The 'get-prev-clef' event is dispatched by a vf-stave child in order to
    // get the clef of the stave that proceeds it.
    this.addEventListener(GetPrevClefEvent.eventName, this._getPrevClef);
  }

  connectedCallback() {
    this._startX = parseInt(this.getAttribute('x')) || this._startX;
    this._startY = parseInt(this.getAttribute('y')) || this._startY;
    this._rendererType = this.getAttribute('renderer') || this._rendererType;

    this._systemsPerLine = parseInt(this.getAttribute('systemsPerLine')) || this._systemsPerLine;

    // Because connectedCallback could be called multiple times, safeguard 
    // against setting up the renderer, factory, etc. more than once. 
    if (!this._isSetup) {
      this._setupVexflow();
      this._setupFactory();
    }

    // vf-score listens to the slotchange event so that it can detect its systems 
    // and set them up accordingly
    this.shadowRoot.querySelector('slot').addEventListener('slotchange', this._registerSystems);
  }

  disconnectedCallback() {
    // TODO (ywsang): Clean up any resources that may need to be cleaned up. 
    this.shadowRoot.querySelector('slot').removeEventListener('slotchange', this._registerSystems);
  }

  static get observedAttributes() { return ['x', 'y', 'width', 'height', 'renderer'] }

  attributeChangedCallback(name, oldValue, newValue) {
    switch(name) {
      case 'x':
      case 'y':
        // TODO (ywsang): Implement code to update the position of the vf-system
        // children. 
        break;
      case 'width':
        this._width = newValue;
        // TODO (ywsang): Implement code to resize the renderer. Need to make 
        // sure the renderer is already created!
        break;
      case 'height':
        this._height = newValue;
        // TODO (ywsang): Implement code to resize the renderer. Need to make 
        // sure the renderer is already created!
        break;
    }
  }

  /**
   * Sets up the renderer, context, and registry for this component.
   * @private
   */
  _setupVexflow() {
    // Default to the SVG renderer if not specified.
    this.shadowRoot.innerHTML = this._rendererType === 'canvas'
      ? `<canvas id='vf-score'><slot></slot></canvas>`
      : `<div id='vf-score'><slot></slot></div>`
    const element = this.shadowRoot.querySelector('#vf-score')

    if (this._rendererType === 'canvas') {
      this._renderer = new Vex.Flow.Renderer(element, Vex.Flow.Renderer.Backends.CANVAS);
    } else { 
      this._renderer = new Vex.Flow.Renderer(element, Vex.Flow.Renderer.Backends.SVG);
    }

    this._context = this._renderer.getContext();
    this.registry = new Vex.Flow.Registry();
  }

  /**
   * Sets up the factory for this component. 
   * @private
   */
  _setupFactory() {
    // Factory is constructed with a null elementId because the underlying code 
    // uses document.querySelector(elementId) to find the element to attach the 
    // renderer to, but the web component puts the element in the shadow DOM. As 
    // such, the element would not be found due to DOM encapsulation. However, 
    // in order to use the simplified EasyScore API constructors, a Factory 
    // instance is still needed. 
    this.vf = new Vex.Flow.Factory({ renderer: { elementId: null } });
    this.vf.setContext(this._context);

    this._isSetup = true;
  }

  /**
   * Resizes the renderer to the score's width and height properties. 
   * @private
   */
  _resize(width = this._width, height = this._height) {
    this._renderer.resize(width, height);
  }

  /** 
   * "Registers" the vf-system children and lays them out.
   * @private
   */
  _registerSystems = () => {
    const systems = this.shadowRoot.querySelector('slot').assignedElements().filter(e => e.nodeName === 'VF-SYSTEM');
    this.totalNumSystems = systems.length;

    const numLines = Math.ceil(this.totalNumSystems / this._systemsPerLine);
    
    // Minus 1 on width to account for the overflow of the right bar line 
    this.systemWidth = Math.floor((this._width - this._startX - 1) / this._systemsPerLine);

    var x = this._startX;
    var y = this._startY;

    var i;
    var lineNumber = 1;

    // Because the last line may not have this._systemsPerLine systems, adjust
    // the systemWidth for the last line to have them fill up the entire line. 
    // This boolean guards against adjusting the width for the last line 
    // multiple times.
    var adjustedLastLine = false;

    for (i = 1; i <= this.totalNumSystems; i++) {
      const system = systems[i-1];

      // Adjust the stave width for the last line
      if (lineNumber === numLines && !adjustedLastLine) {
        // Added i - 1 systems so far
        const systemsLeft = this.totalNumSystems - (i - 1);

        // Minus 1 on width to account for the overflow of the right bar line 
        this.systemWidth = Math.floor((this._width - this._startX - 1) / systemsLeft);
        adjustedLastLine = true;
      }

      system.setupSystem(x, y, this.systemWidth, i % this._systemsPerLine === 1);    
      
      // Update x and y position for the next system
      x += this.systemWidth;
      // If this._systemsPerLine systems have been added to this line, 
      // break to a new line.
      if (i % this._systemsPerLine === 0) { 
        x = this._startX; // Reset x position
        y += this._getSystemLineHeight(system); // Update y position
        lineNumber++;
      }
    }

    // y only gets updated to account for the height of the last line if the 
    // last line was filled, so we need to account for the last line's height if
    // the last line did not have this._systemsPerLines added to it
    if (this.totalNumSystems % this._systemsPerLine !== 0) {
      const lastSystem = systems[this.totalNumSystems - 1];
      y += this._getSystemLineHeight(lastSystem);
    }

    // If a height was provided as an attribute, use that height. 
    // Otherwise, default to the height needed to fit all the lines.
    this._resize(this._width, (this._height) ? this._height : y);

    this._createScore();
  };

  /**
   * Returns the height of a system, based on how many staves are in the system.
   * 
   * @param system The system to calculate the height of. 
   * @return The height of the system. 
   * @private
   */
  _getSystemLineHeight(system) {
    const stavesInSystem = system.childElementCount;

    // TODO (ywsang): Determine if 130 is a good constant for the height of a stave.
    return 130 * stavesInSystem;
  }

  /**
   * This is the event listener for when a vf-system has finished adding its 
   * staves.
   * @private
   */
  _systemCreated = () => {
    this._systemsAdded++;

    // Call this check at the end of the event listener to check whether all
    // systems have returned.
    this._createScore();
  };

  /** 
   * This function checks whether all the child systems have returned events.
   * If so, the vf-score renders the score.
   * @private
   */
  _createScore() {
    if (this.totalNumSystems === this._systemsAdded) {
      this._addSystemConnectors();
      this._addCurves();
      this.vf.draw();
    }
  }

  /**
   * Adds connectors (barlines) to the right and left side of the systems in
   * this score.
   * @private
   */
  _addSystemConnectors() {
    const systems = this.vf.systems;
    const numSystems = systems.length;

    var i;
    for (i = 0; i < numSystems; i++) {
      systems[i].addConnector('singleRight');
      systems[i].addConnector('singleLeft');
    }
  }

  /**
   * Adds any vf-curves to the score.
   * @private
   */
  _addCurves() {
    const curves = this.shadowRoot.querySelector('slot').assignedElements().filter(e => e.nodeName === 'VF-CURVE');
    curves.forEach(curve => {
      curve.addCurve();
    })
  }

  /** 
   * Sets the factory instance of the component that dispatched the event. 
   * @private
   */
  _setFactory = (event) => {
    event.target.vf = this.vf;
  };

  /** 
   * Sets the registry instance of the component that dispatched the event.
   * @private
   */
  _setRegistry = (event) => {
    event.target.registry = this.registry;
  };

 /**
  * Gets the clef of the stave at the same index in the previous system's children
  * as the index of the stave that dispatched this event in its parent system's
  * children.
  * 
  * @private
  */
  _getPrevClef() {
    const stave = event.target;
    const staveIndex = event.staveIndex;
    const staveParentSystem = event.staveParentSystem;

    const prevSystem = this._getPrevSystem(staveParentSystem);
    stave.clef = (prevSystem) ? prevSystem.children[staveIndex].clef : 'treble';
  }

  /** Gets the system that proceeds the given @param system inside this score. 
   * @param {VFSystem} system - The system to find the previous silbing of. 
  */
  _getPrevSystem(system) {
    var prevSibling = system.previousSibling;
    
    while (prevSibling && prevSibling.nodeName !== `VF-SYSTEM`) {
      prevSibling = prevSibling.previousSibling;
    }

    return prevSibling;
  }
}

window.customElements.define('vf-score', VFScore);
