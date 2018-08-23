import states from './states';

export default ({ state, ...params }) => states[state](params);
