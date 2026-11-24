import { makeTicker } from './ticker';

/** The current animation frame number, shared by all spinners. `null` while `active` is false. */
export const useSpinnerFrame = makeTicker(90);
