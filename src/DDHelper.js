import clone from 'component-clone';

function _keyToArray(key) {
  key = key.trim();
  if (key === '') {
    return [];
  }
  key = key.replace(/\[(\w+)\]/g, '.$1');
  key = key.replace(/^\./, '');
  return key.split('.');
}

class DDHelper {

  static get(key, digitalData) {
    const keyParts = _keyToArray(key);
    let nestedVar = clone(digitalData);
    while (keyParts.length > 0) {
      const childKey = keyParts.shift();
      if (nestedVar.hasOwnProperty(childKey)) {
        nestedVar = nestedVar[childKey];
      } else {
        return undefined;
      }
    }
    return nestedVar;
  }

  static getProduct(id) {
    console.log(id);
  }

  static getCampaign(id) {
    console.log(id);
  }

}

export default DDHelper;
