import assert from 'node:assert/strict';
import {inspectedPose} from '../js/pose-inspector.js';
import {posesFor} from '../js/contact.js';
import {trainingPoses} from '../js/training.js';

const actualPose = objects => trainingPoses(objects, posesFor(objects));
const state = (objects, id = 'D1') => inspectedPose(objects, id, actualPose(objects));
const player = {id: 'D1', type: 'defender', label: 'D1', playerPose: 'standing'};
const donut = {id: 'pad', type: 'donut', donutState: 'down', donutTacklerId: 'D1'};
const stopped = [player, donut];

// The screenshot's exact failure: pitch tackles while the saved field still says standing.
assert.equal(player.playerPose, 'standing');
assert.equal(state(stopped).pose, 'tackling');
assert.equal(state(stopped).source, 'donut');
assert.equal(state([{...donut, donutState: 'impact'}, player]).pose, 'tackling');

// Choosing Standing in the inspector pins the pose and changes the pitch too.
const override = {...player, playerPose: 'standing', posePinned: true};
assert.equal(state([override, donut]).pose, 'standing');
assert.equal(state([override, donut]).source, 'manual');

// Removing the override restores the automatic tackling pose.
const restored = {...override};
delete restored.posePinned;
delete restored.playerPose;
assert.equal(state([restored, donut]).pose, 'tackling');
assert.equal(state([restored, donut]).source, 'donut');

// Reset or rolling donut must not create a tackling pose.
for (const donutState of ['ready', 'rolling']) {
  assert.equal(state([player, {...donut, donutState}]).pose, 'standing');
  assert.equal(state([player, {...donut, donutState}]).source, 'player');
}

// Contact formation remains authoritative and is displayed as a managed pose.
const tackle = {id: 'tackle', type: 'tackle', members: [{id: 'D1', pose: 'grounded'}]};
assert.equal(state([player, donut, tackle]).pose, 'grounded');
assert.equal(state([player, donut, tackle]).source, 'formation');

// Non-existing selections do not generate an invented tackle.
assert.equal(state([player, donut], 'missing').source, 'none');
console.log('Rugby pose inspector: donut impact, stop, manual override, reset and contact precedence passed.');
