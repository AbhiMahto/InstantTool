const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');

async function test() {
  const formData = new FormData();
  formData.append('size', 'auto');
  
  // create dummy image file
  const canvas = require('canvas'); // wait, I might not have canvas. Let's just download a random image
}
test();
