import { handle } from '../src/modules/site/router.js';

export const onRequest = (context) => handle(context);
