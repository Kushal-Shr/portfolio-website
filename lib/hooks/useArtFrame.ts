import { makeTicker } from './ticker';

/** The frame clock for the animated ASCII pictures: one timer for every picture on the page. */
export const useArtFrame = makeTicker(420);
