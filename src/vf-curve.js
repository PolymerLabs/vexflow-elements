import './vf-score';
import StaveAddedEvent from './events/staveAddedEvent';
import ElementAddedEvent from './events/elementAddedEvent';

/**
 * Implements the `vf-curve` web component, the web component that resembles 
 * VexFlow's `Curve` element. 
 * 
 * `vf-curve`s should be children of `vf-score`, and a curve can be drawn within
 * or across systems.
 */
export class VFCurve extends HTMLElement {

  /**
   * The Vex.Flow.Factory instance to use.
   * @type {Vex.Flow.Factory}
   * @private
   */
  _vf;

  /**
   * The Vex.Flow.Registry instance to use when registering elements.
   * @type {Vex.Flow.Registry}
   * @private
   */
  _registry;

  /**
   * The id of the note to start the curve from.
   * @type {String}
   * @private
   */
  _startId;

  /**
   * The id of the note to end the curve at.
   * @type {String}
   * @private
   */
  _endId;

  connectedCallback() {
    this._startId = this.getAttribute('from');
    this._endId = this.getAttribute('to');

    this.dispatchEvent(new StaveAddedEvent()); // TODO: Make more generic, used by stave + curve to get the registry
    this.dispatchEvent(new ElementAddedEvent());
  }

  /**
   * Setter to detect when the Factory instance is set. Once the Factory is set,
   * vf-stave can start creating components. 
   * 
   * @param {Vex.Flow.Factory} value - The Factory instance that the overall 
   *                                   component is using, set by the parent 
   *                                   vf-score.
   */
  set vf(value) {
    this._vf = value;
  }

  /**
   * Setter to detect when the Registry instance is set.
   * 
   * @param {Vex.Flow.Factory} value - The Registry instance that the overall 
   *                                   component is using, set by the parent 
   *                                   vf-score.
   */
  set registry(value) {
    this._registry = value;
  }

  /**
   * Creates the curve.
   */
  addCurve() {
    this._vf.Curve({
      from: this._getNoteFromId(this._startId),
      to: this._getNoteFromId(this._endId),
    });
  }

  /**
   * Retrieves the note with the given id from the score's registry.
   * 
   * @param {String} id - The id of the note to get.
   * @returns {Vex.Flow.StaveNote}
   */
  _getNoteFromId(id) {
    return this._registry.getElementById(id);
  }
}

window.customElements.define('vf-curve', VFCurve);
