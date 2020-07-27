/**
 * Creates StavesNotes from the provided text, utlizing the provided EasyScore
 * instance. If the notes have their own stem direction provided in the text 
 * (e.g. C4/q[stem='down]), the note's stem direction takes precendence over 
 * the provided stemDirection. 
 * 
 * Utlizes the EasyScore API Grammar & Parser. 
 * 
 * @param {Vex.Flow.EasyScore} score - The EasyScore instance to use.
 * @param {String} text - The string to parse and create notes from. 
 * @param {String} stemDirection - The stem direction for the notes. Individual 
 *                                 notes can override this.
 * @returns {[Vex.Flow.StaveNote]} -  The notes that were generated from 
 *                                    @param text . 
 */
export function createNotesFromText(score, text, stemDirection) {
  score.set({ stem: stemDirection });
  const staveNotes = score.notes(text);
  return staveNotes
}

/**
 * Creates a Beam for the provides notes, utilizing the provided EasyScore 
 * instance. 
 * 
 * @param {Vex.Flow.EasyScore} score - The EasyScore instance to use.
 * @param {[Vex.Flow.StaveNote]} notes - The StaveNotes to create a beam for.
 * @returns {Vex.Flow.Beam} - The Beam generated to connect @param notes . 
 */
export function createBeamForNotes(score, notes) { 
  const beam = score.beam(notes);
  return beam;
}