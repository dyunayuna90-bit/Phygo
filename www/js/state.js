"use strict";

const els = {
  materiEyebrow: document.getElementById('materiEyebrow'),
  materiTitle: document.getElementById('materiTitle'),
  materiBody: document.getElementById('materiBody'),
  materiFormula: document.getElementById('materiFormula'),
  materiFormulaNote: document.getElementById('materiFormulaNote'),
  btnKeSimulasi: document.getElementById('btnKeSimulasi'),
  wizardProgress: document.getElementById('wizardProgress'),
  wizardBody: document.getElementById('wizardBody'),
  wizBack: document.getElementById('wizBack'),
  wizExit: document.getElementById('wizExit'),
  wizPrimary: document.getElementById('wizPrimary'),
};

const app = {
  completed: new Set(JSON.parse(localStorage.getItem('phygo_completed') || '[]')),
  justUnlockedLevel: null,
  params: {}, attempts: {1:0,2:0,3:0}, calc: {}, calcChain: {1:{},2:{},3:{}}, locked: {}, running: false,
};
const wizard = { level:1, step:0, previousStep:0 };
