// Entry point. Each module owns one part of the store.

import { initShelf } from './shelf.js';
import { initTracks } from './tracks.js';
import { initReels } from './reel.js';
import { initMedia } from './media.js';

initShelf();
initTracks();
initReels();
initMedia();
