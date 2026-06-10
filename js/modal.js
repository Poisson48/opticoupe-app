'use strict';
import { t } from './i18n.js';

let _inputId = null, _callback = null;

export function openTxtModal(labelKey, inputId, callback) {
  document.getElementById('modal-title').textContent = t(labelKey);
  document.getElementById('modal-ta').value = document.getElementById(inputId).value || '';
  document.getElementById('txt-modal').style.display = 'flex';
  document.getElementById('modal-ta').focus();
  _inputId = inputId; _callback = callback;
}

export function saveTxtModal() {
  if (_inputId) {
    document.getElementById(_inputId).value = document.getElementById('modal-ta').value;
    if (_callback) _callback();
  }
  closeTxtModal();
}

export function closeTxtModal() {
  document.getElementById('txt-modal').style.display = 'none';
  _inputId = null; _callback = null;
}

export function refreshMatDescBtn() {
  const val = document.getElementById('proj-mat-desc').value || '';
  document.getElementById('mat-desc-preview').textContent =
    val ? (val.length > 40 ? val.slice(0,40)+'…' : val) : t('matDescEmpty');
}

export function refreshCommentsBtn() {
  const val = document.getElementById('proj-comments').value || '';
  document.getElementById('comments-preview').textContent =
    val ? (val.length > 40 ? val.slice(0,40)+'…' : val) : t('commentsEmpty');
}
