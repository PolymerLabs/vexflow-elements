// ## Description
// 
// This file implements `vf-tuplet`, the web component that closely resembles 
// the `Beam` element.
// `vf-beam` is responsible for creating notes from its text content and the beam
// for those notes. One beam goes across all of the notes.
// Once the beam and notes are created, `vf-beam` dispatches an event to its parent
// `vf-voice` to signal that it's ready for its notes and beam to be added to
// the stave.

import './vf-voice';
import { createBeamForNotes, createNotesFromText } from './utils';
import BeamReadyEvent from './events/beamReadyEvent';
import ElementAddedEvent from './events/elementAddedEvent';
import GetParentStemEvent from './events/getParentStemEvent';

export class VFBeam extends HTMLElement {

  /**
   * The Vex.Flow.EasyScore instance to use.
   * @type {Vex.Flow.Registry}
   * @private
   */
  _score;

  /**
   * The direction of the stems in the beam.
   * @type {String}
   * @private
   */
  stemDirection = 'up';

  /**
   * The notes that make up this vf-beam.
   * @type {[Vex.Flow.StaveNote]}
   */
  notes;

  /**
   * The beam for this vf-beam.
   * @type {Vex.Flow.Beam}
   */
  beam;

  constructor() {
    super();
  }

  connectedCallback() {
    // If this vf-beam component provides its own stem direction, respect it.
    // If it doesn't provide its own stem direction, use the stem direction of 
    // its parent vf-voice.
    if (this.getAttribute('stem')) {
      this.stemDirection = this.getAttribute('stem');
    } else {
      this.dispatchEvent(new GetParentStemEvent());
    }

    this.dispatchEvent(new ElementAddedEvent());
  }

  /**
   * Setter to detect when the EasyScore instance is set. Once the EasyScore
   * instances is set, vf-beam can start creating components.
   *
   * @param {Vex.Flow.EasyScore} value - The EasyScore instance that the parent
   *                                     stave and its children are using, set
   *                                     by the parent vf-stave.
   */
  set score(value) {
    this._score = value;
    this.createNotesAndBeam();
  }

  /**
   * Creates the StaveNotes and Beam from the text content of this vf-beam.
   */
  createNotesAndBeam() {
    this.notes = createNotesFromText(this._score, this.textContent, this.stemDirection);
    this.beam = createBeamForNotes(this._score, this.notes);

    /** 
     * Tell the parent vf-voice that this vf-beam has finished creating its 
     * notes and beam and is ready to be added to the voice.
     */
    this.dispatchEvent(new BeamReadyEvent());
  }
}

window.customElements.define('vf-beam', VFBeam);
