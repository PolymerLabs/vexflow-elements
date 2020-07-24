 
// ## Description
// 
// This file implements `vf-voice`, the web component that resembles 
// the `Voice` element. 
// `vf-voice` is responsible for generating and/or gathering
// all of the notes and beams that make up the voice, including those from its
// child components, which may be `vf-tuplet`s and `vf-beam`s. 
// Once all the notes and beams are created, `vf-voice` dispatches an event to
// its parent `vf-stave` to signal that it's ready for the voice to be created
// the voice.

import Vex from 'vexflow';

import './vf-stave';
import ElementAddedEvent from './events/elementAddedEvent';
import VoiceReadyEvent from './events/voiceReadyEvent';

export class VFVoice extends HTMLElement {

  /**
   * The Vex.Flow.Factory instance to use.
   * @type {Vex.Flow.Factory}
   * @private
   */
  _vf;

  /**
   * The Vex.Flow.EasyScore instance to use.
   * @type {Vex.Flow.Registry}
   * @private
   */
  _score;

  /**
   * The stem direction for this voice. Can be 'up' or 'down'. 
   * @type {string}
   */
  stem = 'up';

  /**
   * Boolean indicating whether to autogenerate beams for this voice.
   * @type {boolean}
   */
  autoBeam = false;

  /**
   * The notes that make up this voice.
   * @type {[Vex.Flow.StaveNote]}
   */
  notes = [];

  /**
   * The beams that make up this voice.
   * @type {[Vex.Flow.Beam]}
   */
  beams = [];

  constructor() {
    super();

    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    this.stem = this.getAttribute('stem') || this.stem;
    this.autoBeam = this.hasAttribute('autoBeam');

    this.dispatchEvent(new ElementAddedEvent());
  }

  static get observedAttributes() { return ['stem', 'autoBeam'] }

  attributeChangedCallback(name, oldValue, newValue) {
    // TODO (ywsang): Implement code to update based on changes to attributes
  }

   /**
   * Setter to detect when the Factory instance is set. Once the Factory and
   * EasyScore instances are set, vf-voice can start creating components. 
   * 
   * @param {Vex.Flow.Factory} value - The Factory instance that the overall 
   *                                   component is using, set by the parent 
   *                                   vf-score.
   */
  set vf(value) {
    this._vf = value;
    this.createNotes();
  }

   /**
   * Setter to detect when the EasyScore instance is set. Once the Factory and
   * EasyScore instances are set, vf-voice can start creating components. 
   * 
   * @param {Vex.Flow.EasyScore} value - The EasyScore instance that the parent 
   *                                     stave and its children are using, set 
   *                                     by the parent vf-stave.
   */
  set score(value) {
    this._score = value;
    this.createNotes();
  }

  /**
   * Creates notes (and optionally, beams) from the text content of this 
   * vf-voice element.
   */
  createNotes = () => {
    if (this._vf && this._score) {
      const notes = this._createNotesFromText(this.textContent.trim());
      // Maintaining notes in an array to set-up for future child components 
      // that will provide their own notes
      this.notes.push(...notes);
      if (this.autoBeam) {
        this.beams.push(...this._autoGenerateBeams(notes));
      }

      this.dispatchEvent(new VoiceReadyEvent(this.notes, this.beams));
    }
  }

  /**
   * Generates notes based on the text content of this vf-voice element. 
   * Utlizes the EasyScore API Grammar & Parser. 
   * 
   * @param {String} text - The string to parse and create notes from. 
   * @return {[Vex.Flow.StaveNote]} - The notes that were generated from the text. 
   * @private
   */
  _createNotesFromText(text) {
    this._score.set({ stem: this.stem });
    const staveNotes = this._score.notes(text);
    return staveNotes;
  }

  /**
   * Automatically generates beams for the provided notes. 
   * 
   * @param {[Vex.Flow.StaveNote]} notes - The notes to autogenerate beams for.
   * @return {[Vex.Flow.Beam]} - The autogenerated beams. 
   * @private
   */
  _autoGenerateBeams(notes) {
    // TODO (ywsang): Use default beam groups?
    // const groups = Vex.Flow.Beam.getDefaultBeamGroups(this._score.defaults.time);
    // const beams = Vex.Flow.Beam.generateBeams(notes, {
    //   groups: groups
    // });
    const beams = Vex.Flow.Beam.generateBeams(notes);
    beams.forEach( beam => {
      this._vf.renderQ.push(beam);
    })
    return beams;
  }
}

window.customElements.define('vf-voice', VFVoice);
