// 判断节点类型
const nodeType = {
  isElement(node) {
    return node.nodeType === 1;
  },
  isText(node) {
    return node.nodeType === 3;
  },
};

// 更新视图
const updater = {
  text(node, val) {
    node.textContent = val;
  },
  // 还有 model 啥的，但实际都差不多
  value(node,val){
     node.value = val; 
  }
};
const reg = /\{\{(.*)\}\}/;
class Compile {
  constructor(el, vm) {
    this.vm = vm;
    this.el = document.querySelector(el);
    this.fragment = null;
    this.init();
    console.log(el)
  }

  init() {
    if(this.el) {
      this.fragment = this.nodeToFragment(this.el);
      this.compileElement(this.fragment);
      this.el.appendChild(this.fragment);
    }
  }

  nodeToFragment(el) {
    // 使用 document.createDocumentFragment 的目的就是减少 Dom 操作
    const fragment = document.createDocumentFragment();
    let child = el.firstChild;

    // 将原生节点转移到 fragment
    while(child) {
      fragment.appendChild(child);
      child = el.firstChild;
    }
    return fragment;
  }

  // 根据节点类型不同进行不同的编译
  compileElement(el) {
    const childNodes = el.childNodes;
    
    [].slice.call(childNodes).forEach((node) => {
       
      
      const text = node.textContent;
     // console.log(node.nodeType,text)
      // 根据不同的 node 类型，进行编译，分别编译指令以及文本节点
      if(nodeType.isElement(node)) {
        this.compileEl(node);
      } else if(nodeType.isText(node) && reg.test(text)) {
        this.compileText(node, reg.exec(text)[1]);
      }
      // 递归的对元素节点进行深层编译
      if(node.childNodes && node.childNodes.length) {
        this.compileElement(node);
      }
    });
  }

  // 在这里我们就完成了对 Watcher 的添加
  compileText(node, exp) {
     // console.log(this.vm,"???",exp.trim())
    const value = this.vm[exp.trim()];
    updater.text(node, value);
    new Watcher(this.vm, exp, (val) => {
      updater.text(node, val);
    });
  }

  compileEl(node) {
    const attrs = node.attributes;
    Object.values(attrs).forEach(attr => {
      var name = attr.name;
      if(name == "value"){
             let exp = reg.exec(attr.value)[1];
             let value = this.vm[exp.trim()];
            updater.value(node, value);
            new Watcher(this.vm, exp, (val) => {
              updater.value(node, val);
            });
          }
        // 只做事件绑定
        if(name.indexOf('on') >= 0) {
            const exp = attr.value;
          this.compileEvent(node, name, exp);
      }
    });
  }

  compileEvent(node, dir, exp) {
    const eventType = dir.split(':')[1];
    const cb = this.vm.methods[exp];
    if(eventType && cb) {
      node.addEventListener(eventType, cb.bind(this.vm));
    }
    if(eventType == 'change'){
        node.addEventListener('input', cb.bind(this.vm));
    }
  }
}