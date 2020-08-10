import Vex from 'vexflow';

import './vf-voice';

import { createBeamForNotes, createNotesFromText } from './utils';
import ElementAddedEvent from './events/elementAddedEvent';
import ElementReadyEvent from './events/elementReadyEvent';
import GetParentStemEvent from './events/getParentStemEvent';

/**
 * Implements `vf-tuplet`, the web component that closely resembles the `Tuplet`
 * element.
 * `vf-tuplet` is responsible for creating the tuplet, and optionally the beam,  
 * from its text content.
 * Once the tuplet is created, `vf-tuplet` dispatches an event to its parent
 * `vf-voice` to signal that it's ready for its tuplet (and beam) to be added to
 * the voice.
 */
export class VFTuplet extends HTMLElement {

  /**
   * The Vex.Flow.EasyScore instance to use.
   * @type {Vex.Flow.Registry}
   * @private
   */
  _score;

  /**
   * Boolean represented whether the notes in the tuplet should be attached
   * by a beam.
   * @type {Boolean}
   * @private
   */
  _beamed = false;

  /**
   * The direction of the stems in the tuplet. If the notes have their own stem
   * direction in the text (e.g. C4/q[stem='down]), the note's stem direction
   * takes precendence over this property.
   * @type {String}
   * @private
   */
  stemDirection = 'up';

  /**
   * The location of the tuplet notation. Can be above or below the notes.
   * @type {String}
   * @private
   */
  _location = 'above';

  /**
   * The notes that make up the tuplet.
   * @type {[Vex.Flow.StaveNote]}
   * @private
   */
  _notes;

  /**
   * The tuplet created from the component's text content.
   * @type {Vex.Flow.Tuplet}
   */
  tuplet;

  /**
   * The beam for the tuplet. Undefined if the VFTuplet if _beamed = false;
   * @type {Vex.Flow.Beam}
   */
  beam;

  constructor() {
    super();
  }

  connectedCallback() {
    this._beamed = this.hasAttribute('beamed');
    this._location = this.getAttribute('location') || this._location;

    // If this vf-tuplet component provides its own stem direction, respect it.
    // If it doesn't provide its own stem direction, use the stem direction of 
    // its parent vf-voice.
    if (this.getAttribute('stem')) {
      this.stemDirection = this.getAttribute('stem');
    } else {
      this.dispatchEvent(new GetParentStemEvent());
    }

    this.dispatchEvent(new ElementAddedEvent());
  }

  static get observedAttributes() { return ['beamed', 'location', 'numNotes', 'notesOccupied'] }

  attributeChangedCallback(name, oldValue, newValue) {
    // TODO (ywsang): Implement code to update based on changes to attributes
  }

  /**
   * Setter to detect when the EasyScore instance is set. Once the EasyScore
   * instance is set, vf-tuplet can start creating components.
   *
   * @param {Vex.Flow.EasyScore} value - The EasyScore instance that the parent
   *                                     stave and its children are using, set
   *                                     by the parent vf-stave.
   */
  set score(value) {
    this._score = value;
    this.createTuplet();
  }

  /**
   * Creates a Vex.Flow.Tuplet from the textContent of the component.
   */
  createTuplet() {
    // this._createNotes(this.textContent);

    this._notes = createNotesFromText(this._score, this.textContent, this.stemDirection);
    // As in the original VexFlow library: If numNotes is not specified, default
    // to num_notes = length of the notes the tuplet is created from.
    const numNotes = (this.hasAttribute('numNotes')) ? this.getAttribute('numNotes') : this._notes.length;

    // As in the original VexFlow library: If notesOccupied is not specified,
    // default to notesOccupied = 2.
    const notesOccupied = this.getAttribute('notesOccupied') || 2;
    const location = this._location === 'below' ? -1 : 1;
    const bracketed = !this._beamed;

    // Following the original VexFlow library:
    // If the user specifies whether or not to draw the ratio, respect that.
    // If not specified, default to drawing the ratio if the difference between
    // num_notes and notes_occupied is greater than 1.
    var ratioed;
    if (this.hasAttribute('ratioed')) {
      ratioed = (this.getAttribute('ratioed') === 'true')
    } else {
      ratioed = numNotes - notesOccupied > 1;
    }

    this.tuplet = this._score.tuplet(this._notes,
      { 
        num_notes: numNotes,
        notes_occupied: notesOccupied,
        location: location,
        bracketed: bracketed,
        ratioed: ratioed,
      }
    );

    if (this._beamed) {
      this.beam = createBeamForNotes(this._score, this._notes);
    }

    /** 
     * Tell the parent vf-voice that this vf-tuplet has finished creating its
     * notes and beam and is ready to be added to the voice.
     */
    this.dispatchEvent(new ElementReadyEvent(ElementReadyEvent.tupletReadyEventName));
  }
}

window.customElements.define('vf-tuplet', VFTuplet);
