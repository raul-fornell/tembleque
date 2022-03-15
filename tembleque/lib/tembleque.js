let appEl;
let appContext;

const bindings = []

class DataBinding {
  constructor(ref, value) {
    this.ref = ref;
    this.currentValue = value;
    this.oldValue = undefined;
    this.inputs = [];
    this.templates = [];
    this.callBacks = [];
  }
}

class Template {
  constructor(el, original) {
    this.el = el;
    this.original = original;
  }
}

export function setupApp(DOMSelector, context) {
  appContext = context;
  appEl = document.querySelector(DOMSelector);
  defineResponsesToSpecialTags(appEl.childNodes);
}

export function defineBindableProperty(ref, initialValue) {
  let item = getBindableProperty(ref);
  if (!item) {
    item = new DataBinding(ref, initialValue);
    bindings.push(item);
  } else {
    item.currentValue = initialValue;
  }
  if (item.templates.length === 0) {
    item.templates = getAllTemplatesUsingThisProperty(ref, appEl.childNodes, [])
  }
  render();
  return item;
}

export function setValueToProperty(ref, value) {
  const item = getBindableProperty(ref);
  if (value !== item.currentValue) {
    item.oldValue = item.currentValue;
    item.currentValue = value;
    item.callBacks.forEach(callBack => callBack(value));
    render();
  }
}

export function watchPropertyChange(ref, callBack) {
  const item = getBindableProperty(ref);
  console.log("REF", ref, callBack);
  item.callBacks.push(callBack);
}

export function getBindableProperty(ref) {
  return bindings.find(item => item.ref === ref);
}

function getAllTemplatesUsingThisProperty(ref, childNodes, list) {
  if (childNodes) {
    childNodes.forEach(el => {
      if (el.firstChild) {
        const hasProperty = el.firstChild.nodeValue.search(`{{${ref}}}`);
        if (hasProperty >= 0) {
          list.push(new Template(el, el.firstChild.nodeValue));
        }
      }
      return getAllTemplatesUsingThisProperty(ref, el.childNodes, list)
    });
  }
  return list;
}

function bindPropertyToInput(ref, inputEl) {
  let item = getBindableProperty(ref);
  if (!item) {
    item = defineBindableProperty(ref, inputEl.value);
  }
  item.inputs.push(inputEl);
}

function defineResponsesToSpecialTags(childNodes) {
  if (childNodes) {
    childNodes.forEach(el => {
      if (el.getAttribute) {
        const ref = el.getAttribute('|bind|');
        if (ref) {
          bindPropertyToInput(ref, el);
          setValueOnInputChange(ref, el);
        }
        const funcName = el.getAttribute('|click|');
        if (funcName) {
          callFunctionOnClickEvent(el, funcName);
        }
        const loop = el.getAttribute('|for|');
        if (loop) {
          watchPropertyChange(loop, () => {
            console.log("PENDING RENDER ON PROPERTY CHANGE");
          });
        }
      }
      defineResponsesToSpecialTags(el.childNodes)
    });
  }
}

function callFunctionOnClickEvent(el, funcName) {
  el.addEventListener('click', () => {
    const chunks = funcName.split("(");
    if (chunks.length === 2) {
      let param = chunks[1].replace(")", "");
      param = getValueFromParamString(param);
      appContext[chunks[0]](param);
    } else {
      appContext[funcName]();
    }
  });
}

function getValueFromParamString(param) {
  if (param.search("'") >= 0) {
    return param.replaceAll("'", "");
  }
  return getBindableProperty(param).currentValue;
}

function setValueOnInputChange(ref, el) {
  const onChange = event => {
    const value = event.target.value;
    setValueToProperty(ref, value);
  };
  el.addEventListener('keyup', onChange);
  el.addEventListener('keydown', onChange);
  el.addEventListener('change', onChange);
}

function render() {
  bindings.forEach(item => {
    item.templates.forEach(template => {
      const updatedNodeValue = template.original.replaceAll(`{{${item.ref}}}`, item.currentValue);
      template.el.firstChild.nodeValue = updatedNodeValue;
    });
    item.inputs.forEach(input => {
      switch (input.type) {
        case "radio":
        case "checkbox":
          input.checked = input.value === item.currentValue;
          break;
        default:
          input.value = item.currentValue;
      }
    });
  });
}