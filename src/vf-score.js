import Vex from 'vexflow';

import ElementAddedEvent from './events/elementAddedEvent';
import ElementReadyEvent from './events/elementReadyEvent';
import StaveAddedEvent from './events/staveAddedEvent';

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
  _x = 10;

  /**
   * The starting y position of system within the score. 
   * @private
   */
  _y = 0;

  /**
   * The entire width of the element holding the music notation.
   * @private  
   */
  _width = 500;

  /**
   * The entire height of the element holding the music notation.
   * @private
   */
  _height = 150; 

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
  }

  connectedCallback() {
    this._x = parseInt(this.getAttribute('x')) || this._x;
    this._y = parseInt(this.getAttribute('y')) || this._y;
    this._rendererType = this.getAttribute('renderer') || this._rendererType;


    // Because connectedCallback could be called multiple times, safeguard 
    // against setting up the renderer, factory, etc. more than once. 
    if (!this._isSetup) {
      this._setupVexflow();
      this._setupFactory();
    }

    // vf-score listens to the slotchange event so that it can detect its system 
    // and set it up accordingly
    this.shadowRoot.querySelector('slot').addEventListener('slotchange', this._registerSystem);
  }

  disconnectedCallback() {
    // TODO (ywsang): Clean up any resources that may need to be cleaned up. 
    this.shadowRoot.querySelector('slot').removeEventListener('slotchange', this._registerSystem);
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

    this._resize();
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
  _resize() {
    this._renderer.resize(this._width, this._height);
  }

  /** 
   * "Registers" the vf-system child. 
   * This PR only supports/assumes one vf-system per vf-score. 
   * @private
   */
  _registerSystem = () => {
    const system = this.shadowRoot.querySelector('slot').assignedElements()[0];
    // TODO (ywsang): Figure out how to account for any added connectors that 
    // get drawn in front of the x position (e.g. brace, bracket)
    // Minus 1 on width to account for the overflow of the right bar line 
    system.setupSystem(this._x, this._y, this._width - this._x - 1); 
  };

  /**
   * Once all systems have dispatched events signalling that they've added their 
   * staves, the entire score is drawn.
   * @private
   */
  _systemCreated = () => {
    this._addSystemConnectors();
    this.vf.draw();
  };

  /**
   * Adds connectors (barlines) to the right and left side of the systems in
   * this score.
   * @private
   */
  _addSystemConnectors() {
    const system = this.vf.systems[0]; // TODO (ywsang): Replace with better 
                                       // logic once more than one system per
                                       // score is allowed. 
    system.addConnector('singleRight');
    system.addConnector('singleLeft');
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
}

window.customElements.define('vf-score', VFScore);
