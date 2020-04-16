String.prototype.findAll = function(string) {
    const matches = [];
    let i = this.indexOf(string);
    while (i !== -1) {
      matches.push(i);
      i = this.indexOf(string, i + string.length);
    }
    return matches;
  }
  ;
  String.prototype.reverse = function() {
    return this.split('').reverse().join('');
  }
  ;
  String.prototype.replaceControlCharacters = function() {
    return this.replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u0080-\u009f]/g, '�');
  }
  ;
  String.prototype.isWhitespace = function() {
    return /^\s*$/.test(this);
  }
  ;
  String.prototype.computeLineEndings = function() {
    const endings = this.findAll('\n');
    endings.push(this.length);
    return endings;
  }
  ;
  String.prototype.escapeCharacters = function(chars) {
    let foundChar = false;
    for (let i = 0; i < chars.length; ++i) {
      if (this.indexOf(chars.charAt(i)) !== -1) {
        foundChar = true;
        break;
      }
    }
    if (!foundChar)
      return String(this);
    let result = '';
    for (let i = 0; i < this.length; ++i) {
      if (chars.indexOf(this.charAt(i)) !== -1)
        result += '\\';
      result += this.charAt(i);
    }
    return result;
  }
  ;
  String.regexSpecialCharacters = function() {
    return '^[]{}()\\.^$*+?|-,';
  }
  ;
  String.prototype.escapeForRegExp = function() {
    return this.escapeCharacters(String.regexSpecialCharacters());
  }
  ;
  String.filterRegex = function(query) {
    const toEscape = String.regexSpecialCharacters();
    let regexString = '';
    for (let i = 0; i < query.length; ++i) {
      let c = query.charAt(i);
      if (toEscape.indexOf(c) !== -1)
        c = '\\' + c;
      if (i)
        regexString += '[^\\0' + c + ']*';
      regexString += c;
    }
    return new RegExp(regexString,'i');
  }
  ;
  String.escapeInvalidUnicodeCharacters = function(text) {
    if (!String._invalidCharactersRegExp) {
      let invalidCharacters = '';
      for (let i = 0xfffe; i <= 0x10ffff; i += 0x10000)
        invalidCharacters += String.fromCodePoint(i, i + 1);
      String._invalidCharactersRegExp = new RegExp(`[${invalidCharacters}\uD800-\uDFFF\uFDD0-\uFDEF]`,'gu');
    }
    let result = '';
    let lastPos = 0;
    while (true) {
      const match = String._invalidCharactersRegExp.exec(text);
      if (!match)
        break;
      result += text.substring(lastPos, match.index) + '\\u' + text.charCodeAt(match.index).toString(16);
      if (match.index + 1 < String._invalidCharactersRegExp.lastIndex)
        result += '\\u' + text.charCodeAt(match.index + 1).toString(16);
      lastPos = String._invalidCharactersRegExp.lastIndex;
    }
    return result + text.substring(lastPos);
  }
  ;
  String.prototype.escapeHTML = function() {
    return this.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  ;
  String.prototype.unescapeHTML = function() {
    return this.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&#58;/g, ':').replace(/&quot;/g, '"').replace(/&#60;/g, '<').replace(/&#62;/g, '>').replace(/&amp;/g, '&');
  }
  ;
  String.prototype.collapseWhitespace = function() {
    return this.replace(/[\s\xA0]+/g, ' ');
  }
  ;
  String.prototype.trimMiddle = function(maxLength) {
    if (this.length <= maxLength)
      return String(this);
    let leftHalf = maxLength >> 1;
    let rightHalf = maxLength - leftHalf - 1;
    if (this.codePointAt(this.length - rightHalf - 1) >= 0x10000) {
      --rightHalf;
      ++leftHalf;
    }
    if (leftHalf > 0 && this.codePointAt(leftHalf - 1) >= 0x10000)
      --leftHalf;
    return this.substr(0, leftHalf) + '\u2026' + this.substr(this.length - rightHalf, rightHalf);
  }
  ;
  String.prototype.trimEnd = function(maxLength) {
    if (this.length <= maxLength)
      return String(this);
    return this.substr(0, maxLength - 1) + '\u2026';
  }
  ;
  String.prototype.trimURL = function(baseURLDomain) {
    let result = this.replace(/^(https|http|file):\/\//i, '');
    if (baseURLDomain) {
      if (result.toLowerCase().startsWith(baseURLDomain.toLowerCase()))
        result = result.substr(baseURLDomain.length);
    }
    return result;
  }
  ;
  String.prototype.toTitleCase = function() {
    return this.substring(0, 1).toUpperCase() + this.substring(1);
  }
  ;
  String.prototype.compareTo = function(other) {
    if (this > other)
      return 1;
    if (this < other)
      return -1;
    return 0;
  }
  ;
  String.prototype.removeURLFragment = function() {
    let fragmentIndex = this.indexOf('#');
    if (fragmentIndex === -1)
      fragmentIndex = this.length;
    return this.substring(0, fragmentIndex);
  }
  ;
  String.hashCode = function(string) {
    if (!string)
      return 0;
    const p = ((1 << 30) * 4 - 5);
    const z = 0x5033d967;
    const z2 = 0x59d2f15d;
    let s = 0;
    let zi = 1;
    for (let i = 0; i < string.length; i++) {
      const xi = string.charCodeAt(i) * z2;
      s = (s + zi * xi) % p;
      zi = (zi * z) % p;
    }
    s = (s + zi * (p - 1)) % p;
    return Math.abs(s | 0);
  }
  ;
  String.isDigitAt = function(string, index) {
    const c = string.charCodeAt(index);
    return (48 <= c && c <= 57);
  }
  ;
  String.prototype.toBase64 = function() {
    function encodeBits(b) {
      return b < 26 ? b + 65 : b < 52 ? b + 71 : b < 62 ? b - 4 : b === 62 ? 43 : b === 63 ? 47 : 65;
    }
    const encoder = new TextEncoder();
    const data = encoder.encode(this.toString());
    const n = data.length;
    let encoded = '';
    if (n === 0)
      return encoded;
    let shift;
    let v = 0;
    for (let i = 0; i < n; i++) {
      shift = i % 3;
      v |= data[i] << (16 >>> shift & 24);
      if (shift === 2) {
        encoded += String.fromCharCode(encodeBits(v >>> 18 & 63), encodeBits(v >>> 12 & 63), encodeBits(v >>> 6 & 63), encodeBits(v & 63));
        v = 0;
      }
    }
    if (shift === 0)
      encoded += String.fromCharCode(encodeBits(v >>> 18 & 63), encodeBits(v >>> 12 & 63), 61, 61);
    else if (shift === 1)
      encoded += String.fromCharCode(encodeBits(v >>> 18 & 63), encodeBits(v >>> 12 & 63), encodeBits(v >>> 6 & 63), 61);
    return encoded;
  }
  ;
  String.naturalOrderComparator = function(a, b) {
    const chunk = /^\d+|^\D+/;
    let chunka, chunkb, anum, bnum;
    while (1) {
      if (a) {
        if (!b)
          return 1;
      } else {
        if (b)
          return -1;
        else
          return 0;
      }
      chunka = a.match(chunk)[0];
      chunkb = b.match(chunk)[0];
      anum = !isNaN(chunka);
      bnum = !isNaN(chunkb);
      if (anum && !bnum)
        return -1;
      if (bnum && !anum)
        return 1;
      if (anum && bnum) {
        const diff = chunka - chunkb;
        if (diff)
          return diff;
        if (chunka.length !== chunkb.length) {
          if (!+chunka && !+chunkb)
            return chunka.length - chunkb.length;
          else
            return chunkb.length - chunka.length;
        }
      } else if (chunka !== chunkb) {
        return (chunka < chunkb) ? -1 : 1;
      }
      a = a.substring(chunka.length);
      b = b.substring(chunkb.length);
    }
  }
  ;
  String.caseInsensetiveComparator = function(a, b) {
    a = a.toUpperCase();
    b = b.toUpperCase();
    if (a === b)
      return 0;
    return a > b ? 1 : -1;
  }
  ;
  Number.constrain = function(num, min, max) {
    if (num < min)
      num = min;
    else if (num > max)
      num = max;
    return num;
  }
  ;
  Number.gcd = function(a, b) {
    if (b === 0)
      return a;
    else
      return Number.gcd(b, a % b);
  }
  ;
  Number.toFixedIfFloating = function(value) {
    if (!value || isNaN(value))
      return value;
    const number = Number(value);
    return number % 1 ? number.toFixed(3) : String(number);
  }
  ;
  Date.prototype.isValid = function() {
    return !isNaN(this.getTime());
  }
  ;
  Date.prototype.toISO8601Compact = function() {
    function leadZero(x) {
      return (x > 9 ? '' : '0') + x;
    }
    return this.getFullYear() + leadZero(this.getMonth() + 1) + leadZero(this.getDate()) + 'T' + leadZero(this.getHours()) + leadZero(this.getMinutes()) + leadZero(this.getSeconds());
  }
  ;
  Object.defineProperty(Array.prototype, 'remove', {
    value: function(value, firstOnly) {
      let index = this.indexOf(value);
      if (index === -1)
        return false;
      if (firstOnly) {
        this.splice(index, 1);
        return true;
      }
      for (let i = index + 1, n = this.length; i < n; ++i) {
        if (this[i] !== value)
          this[index++] = this[i];
      }
      this.length = index;
      return true;
    }
  });
  Object.defineProperty(Array.prototype, 'pushAll', {
    value: function(array) {
      for (let i = 0; i < array.length; ++i)
        this.push(array[i]);
    }
  });
  Object.defineProperty(Array.prototype, 'rotate', {
    value: function(index) {
      const result = [];
      for (let i = index; i < index + this.length; ++i)
        result.push(this[i % this.length]);
      return result;
    }
  });
  Object.defineProperty(Array.prototype, 'sortNumbers', {
    value: function() {
      function numericComparator(a, b) {
        return a - b;
      }
      this.sort(numericComparator);
    }
  });
  (function() {
    const partition = {
      value: function(comparator, left, right, pivotIndex) {
        function swap(array, i1, i2) {
          const temp = array[i1];
          array[i1] = array[i2];
          array[i2] = temp;
        }
        const pivotValue = this[pivotIndex];
        swap(this, right, pivotIndex);
        let storeIndex = left;
        for (let i = left; i < right; ++i) {
          if (comparator(this[i], pivotValue) < 0) {
            swap(this, storeIndex, i);
            ++storeIndex;
          }
        }
        swap(this, right, storeIndex);
        return storeIndex;
      }
    };
    Object.defineProperty(Array.prototype, 'partition', partition);
    Object.defineProperty(Uint32Array.prototype, 'partition', partition);
    const sortRange = {
      value: function(comparator, leftBound, rightBound, sortWindowLeft, sortWindowRight) {
        function quickSortRange(array, comparator, left, right, sortWindowLeft, sortWindowRight) {
          if (right <= left)
            return;
          const pivotIndex = Math.floor(Math.random() * (right - left)) + left;
          const pivotNewIndex = array.partition(comparator, left, right, pivotIndex);
          if (sortWindowLeft < pivotNewIndex)
            quickSortRange(array, comparator, left, pivotNewIndex - 1, sortWindowLeft, sortWindowRight);
          if (pivotNewIndex < sortWindowRight)
            quickSortRange(array, comparator, pivotNewIndex + 1, right, sortWindowLeft, sortWindowRight);
        }
        if (leftBound === 0 && rightBound === (this.length - 1) && sortWindowLeft === 0 && sortWindowRight >= rightBound)
          this.sort(comparator);
        else
          quickSortRange(this, comparator, leftBound, rightBound, sortWindowLeft, sortWindowRight);
        return this;
      }
    };
    Object.defineProperty(Array.prototype, 'sortRange', sortRange);
    Object.defineProperty(Uint32Array.prototype, 'sortRange', sortRange);
  }
  )();
  Object.defineProperty(Array.prototype, 'lowerBound', {
    value: function(object, comparator, left, right) {
      function defaultComparator(a, b) {
        return a < b ? -1 : (a > b ? 1 : 0);
      }
      comparator = comparator || defaultComparator;
      let l = left || 0;
      let r = right !== undefined ? right : this.length;
      while (l < r) {
        const m = (l + r) >> 1;
        if (comparator(object, this[m]) > 0)
          l = m + 1;
        else
          r = m;
      }
      return r;
    }
  });
  Object.defineProperty(Array.prototype, 'upperBound', {
    value: function(object, comparator, left, right) {
      function defaultComparator(a, b) {
        return a < b ? -1 : (a > b ? 1 : 0);
      }
      comparator = comparator || defaultComparator;
      let l = left || 0;
      let r = right !== undefined ? right : this.length;
      while (l < r) {
        const m = (l + r) >> 1;
        if (comparator(object, this[m]) >= 0)
          l = m + 1;
        else
          r = m;
      }
      return r;
    }
  });
  Object.defineProperty(Uint32Array.prototype, 'lowerBound', {
    value: Array.prototype.lowerBound
  });
  Object.defineProperty(Uint32Array.prototype, 'upperBound', {
    value: Array.prototype.upperBound
  });
  Object.defineProperty(Int32Array.prototype, 'lowerBound', {
    value: Array.prototype.lowerBound
  });
  Object.defineProperty(Int32Array.prototype, 'upperBound', {
    value: Array.prototype.upperBound
  });
  Object.defineProperty(Float64Array.prototype, 'lowerBound', {
    value: Array.prototype.lowerBound
  });
  Object.defineProperty(Array.prototype, 'binaryIndexOf', {
    value: function(value, comparator) {
      const index = this.lowerBound(value, comparator);
      return index < this.length && comparator(value, this[index]) === 0 ? index : -1;
    }
  });
  Object.defineProperty(Array.prototype, 'select', {
    value: function(field) {
      const result = new Array(this.length);
      for (let i = 0; i < this.length; ++i)
        result[i] = this[i][field];
      return result;
    }
  });
  Object.defineProperty(Array.prototype, 'peekLast', {
    value: function() {
      return this[this.length - 1];
    }
  });
const ProfileNode = class {
    constructor(callFrame) {
      this.callFrame = callFrame;
      this.callUID = `${callFrame.functionName}@${callFrame.scriptId}:${callFrame.lineNumber}:${callFrame.columnNumber}`;
      this.self = 0;
      this.total = 0;
      this.id = 0;
      this.parent = null;
      this.children = [];
    }
    get functionName() {
      return this.callFrame.functionName;
    }
    get scriptId() {
      return this.callFrame.scriptId;
    }
    get url() {
      return this.callFrame.url;
    }
    get lineNumber() {
      return this.callFrame.lineNumber;
    }
    get columnNumber() {
      return this.callFrame.columnNumber;
    }
  }
  ;
const CPUProfileNode = class extends ProfileNode {
    constructor(node, sampleTime) {
      const callFrame = node.callFrame || ({
        functionName: node['functionName'],
        scriptId: node['scriptId'],
        url: node['url'],
        lineNumber: node['lineNumber'] - 1,
        columnNumber: node['columnNumber'] - 1
      });
      super(callFrame);
      this.id = node.id;
      this.self = node.hitCount * sampleTime;
      this.positionTicks = node.positionTicks;
      this.deoptReason = node.deoptReason && node.deoptReason !== 'no reason' ? node.deoptReason : null;
    }
  }
  ;
const ProfileTreeModel = class {
    constructor(target) {
      this._target = target || null;
    }
    initialize(root) {
      this.root = root;
      this._assignDepthsAndParents();
      this.total = this._calculateTotals(this.root);
    }
    _assignDepthsAndParents() {
      const root = this.root;
      root.depth = -1;
      root.parent = null;
      this.maxDepth = 0;
      const nodesToTraverse = [root];
      while (nodesToTraverse.length) {
        const parent = nodesToTraverse.pop();
        const depth = parent.depth + 1;
        if (depth > this.maxDepth)
          this.maxDepth = depth;
        const children = parent.children;
        const length = children.length;
        for (let i = 0; i < length; ++i) {
          const child = children[i];
          child.depth = depth;
          child.parent = parent;
          if (child.children.length)
            nodesToTraverse.push(child);
        }
      }
    }
    _calculateTotals(root) {
      const nodesToTraverse = [root];
      const dfsList = [];
      while (nodesToTraverse.length) {
        const node = nodesToTraverse.pop();
        node.total = node.self;
        dfsList.push(node);
        nodesToTraverse.push(...node.children);
      }
      while (dfsList.length > 1) {
        const node = dfsList.pop();
        node.parent.total += node.total;
      }
      return root.total;
    }
    target() {
      return this._target;
    }
  }
  ;
const CPUProfileDataModel = class extends ProfileTreeModel {
    constructor(profile, target) {
      super(target);
      const isLegacyFormat = !!profile['head'];
      if (isLegacyFormat) {
        this.profileStartTime = profile.startTime * 1000;
        this.profileEndTime = profile.endTime * 1000;
        this.timestamps = profile.timestamps;
        this._compatibilityConversionHeadToNodes(profile);
      } else {
        this.profileStartTime = profile.startTime / 1000;
        this.profileEndTime = profile.endTime / 1000;
        this.timestamps = this._convertTimeDeltas(profile);
      }
      this.samples = profile.samples;
      this.lines = profile.lines;
      this.totalHitCount = 0;
      this.profileHead = this._translateProfileTree(profile.nodes);
      this.initialize(this.profileHead);
      this._extractMetaNodes();
      if (this.samples) {
        this._buildIdToNodeMap();
        this._sortSamples();
        this._normalizeTimestamps();
        this._fixMissingSamples();
      }
    }
    _compatibilityConversionHeadToNodes(profile) {
      if (!profile.head || profile.nodes)
        return;
      const nodes = [];
      convertNodesTree(profile.head);
      profile.nodes = nodes;
      delete profile.head;
      function convertNodesTree(node) {
        nodes.push(node);
        node.children = ((node.children)).map(convertNodesTree);
        return node.id;
      }
    }
    _convertTimeDeltas(profile) {
      if (!profile.timeDeltas)
        return null;
      let lastTimeUsec = profile.startTime;
      const timestamps = new Array(profile.timeDeltas.length);
      for (let i = 0; i < profile.timeDeltas.length; ++i) {
        lastTimeUsec += profile.timeDeltas[i];
        timestamps[i] = lastTimeUsec;
      }
      return timestamps;
    }
    _translateProfileTree(nodes) {
      function isNativeNode(node) {
        if (node.callFrame)
          return !!node.callFrame.url && node.callFrame.url.startsWith('native ');
        return !!node['url'] && node['url'].startsWith('native ');
      }
      function buildChildrenFromParents(nodes) {
        if (nodes[0].children)
          return;
        nodes[0].children = [];
        for (let i = 1; i < nodes.length; ++i) {
          const node = nodes[i];
          const parentNode = nodeByIdMap.get(node.parent);
          if (parentNode.children)
            parentNode.children.push(node.id);
          else
            parentNode.children = [node.id];
        }
      }
      function buildHitCountFromSamples(nodes, samples) {
        if (typeof (nodes[0].hitCount) === 'number')
          return;
        console.assert(samples, 'Error: Neither hitCount nor samples are present in profile.');
        for (let i = 0; i < nodes.length; ++i)
          nodes[i].hitCount = 0;
        for (let i = 0; i < samples.length; ++i)
          ++nodeByIdMap.get(samples[i]).hitCount;
      }
      const nodeByIdMap = new Map();
      for (let i = 0; i < nodes.length; ++i) {
        const node = nodes[i];
        nodeByIdMap.set(node.id, node);
      }
      buildHitCountFromSamples(nodes, this.samples);
      buildChildrenFromParents(nodes);
      this.totalHitCount = nodes.reduce((acc,node)=>acc + node.hitCount, 0);
      const sampleTime = (this.profileEndTime - this.profileStartTime) / this.totalHitCount;
      const keepNatives = false;
      const root = nodes[0];
      const idMap = new Map([[root.id, root.id]]);
      const resultRoot = new CPUProfileNode(root,sampleTime);
      const parentNodeStack = root.children.map(()=>resultRoot);
      const sourceNodeStack = root.children.map(id=>nodeByIdMap.get(id));
      while (sourceNodeStack.length) {
        let parentNode = parentNodeStack.pop();
        const sourceNode = sourceNodeStack.pop();
        if (!sourceNode.children)
          sourceNode.children = [];
        const targetNode = new CPUProfileNode(sourceNode,sampleTime);
        if (keepNatives || !isNativeNode(sourceNode)) {
          parentNode.children.push(targetNode);
          parentNode = targetNode;
        } else {
          parentNode.self += targetNode.self;
        }
        idMap.set(sourceNode.id, parentNode.id);
        parentNodeStack.push.apply(parentNodeStack, sourceNode.children.map(()=>parentNode));
        sourceNodeStack.push.apply(sourceNodeStack, sourceNode.children.map(id=>nodeByIdMap.get(id)));
      }
      if (this.samples)
        this.samples = this.samples.map(id=>idMap.get(id));
      return resultRoot;
    }
    _sortSamples() {
      const timestamps = this.timestamps;
      if (!timestamps)
        return;
      const samples = this.samples;
      const indices = timestamps.map((x,index)=>index);
      indices.sort((a,b)=>timestamps[a] - timestamps[b]);
      for (let i = 0; i < timestamps.length; ++i) {
        let index = indices[i];
        if (index === i)
          continue;
        const savedTimestamp = timestamps[i];
        const savedSample = samples[i];
        let currentIndex = i;
        while (index !== i) {
          samples[currentIndex] = samples[index];
          timestamps[currentIndex] = timestamps[index];
          currentIndex = index;
          index = indices[index];
          indices[currentIndex] = currentIndex;
        }
        samples[currentIndex] = savedSample;
        timestamps[currentIndex] = savedTimestamp;
      }
    }
    _normalizeTimestamps() {
      let timestamps = this.timestamps;
      if (!timestamps) {
        const profileStartTime = this.profileStartTime;
        const interval = (this.profileEndTime - profileStartTime) / this.samples.length;
        timestamps = new Float64Array(this.samples.length + 1);
        for (let i = 0; i < timestamps.length; ++i)
          timestamps[i] = profileStartTime + i * interval;
        this.timestamps = timestamps;
        return;
      }
      for (let i = 0; i < timestamps.length; ++i)
        timestamps[i] /= 1000;
      if (this.samples.length === timestamps.length) {
        const averageSample = (timestamps.peekLast() - timestamps[0]) / (timestamps.length - 1);
        this.timestamps.push(timestamps.peekLast() + averageSample);
      }
      this.profileStartTime = timestamps[0];
      this.profileEndTime = timestamps.peekLast();
    }
    _buildIdToNodeMap() {
      this._idToNode = new Map();
      const idToNode = this._idToNode;
      const stack = [this.profileHead];
      while (stack.length) {
        const node = stack.pop();
        idToNode.set(node.id, node);
        stack.push.apply(stack, node.children);
      }
    }
    _extractMetaNodes() {
      const topLevelNodes = this.profileHead.children;
      for (let i = 0; i < topLevelNodes.length && !(this.gcNode && this.programNode && this.idleNode); i++) {
        const node = topLevelNodes[i];
        if (node.functionName === '(garbage collector)')
          this.gcNode = node;
        else if (node.functionName === '(program)')
          this.programNode = node;
        else if (node.functionName === '(idle)')
          this.idleNode = node;
      }
    }
    _fixMissingSamples() {
      const samples = this.samples;
      const samplesCount = samples.length;
      if (!this.programNode || samplesCount < 3)
        return;
      const idToNode = this._idToNode;
      const programNodeId = this.programNode.id;
      const gcNodeId = this.gcNode ? this.gcNode.id : -1;
      const idleNodeId = this.idleNode ? this.idleNode.id : -1;
      let prevNodeId = samples[0];
      let nodeId = samples[1];
      let count = 0;
      for (let sampleIndex = 1; sampleIndex < samplesCount - 1; sampleIndex++) {
        const nextNodeId = samples[sampleIndex + 1];
        if (nodeId === programNodeId && !isSystemNode(prevNodeId) && !isSystemNode(nextNodeId) && bottomNode(idToNode.get(prevNodeId)) === bottomNode(idToNode.get(nextNodeId))) {
          ++count;
          samples[sampleIndex] = prevNodeId;
        }
        prevNodeId = nodeId;
        nodeId = nextNodeId;
      }
      if (count)
        Common.console.warn(ls`DevTools: CPU profile parser is fixing ${count} missing samples.`);
      function bottomNode(node) {
        while (node.parent && node.parent.parent)
          node = node.parent;
        return node;
      }
      function isSystemNode(nodeId) {
        return nodeId === programNodeId || nodeId === gcNodeId || nodeId === idleNodeId;
      }
    }
    forEachFrame(openFrameCallback, closeFrameCallback, startTime, stopTime) {
      if (!this.profileHead || !this.samples)
        return;
      startTime = startTime || 0;
      stopTime = stopTime || Infinity;
      const samples = this.samples;
      const timestamps = this.timestamps;
      const idToNode = this._idToNode;
      const gcNode = this.gcNode;
      const samplesCount = samples.length;
      const startIndex = timestamps.lowerBound(startTime);
      let stackTop = 0;
      const stackNodes = [];
      let prevId = this.profileHead.id;
      let sampleTime;
      let gcParentNode = null;
      const stackDepth = this.maxDepth + 3;
      if (!this._stackStartTimes)
        this._stackStartTimes = new Float64Array(stackDepth);
      const stackStartTimes = this._stackStartTimes;
      if (!this._stackChildrenDuration)
        this._stackChildrenDuration = new Float64Array(stackDepth);
      const stackChildrenDuration = this._stackChildrenDuration;
      let node;
      let sampleIndex;
      for (sampleIndex = startIndex; sampleIndex < samplesCount; sampleIndex++) {
        sampleTime = timestamps[sampleIndex];
        if (sampleTime >= stopTime)
          break;
        const id = samples[sampleIndex];
        if (id === prevId)
          continue;
        node = idToNode.get(id);
        let prevNode = idToNode.get(prevId);
        if (node === gcNode) {
          gcParentNode = prevNode;
          openFrameCallback(gcParentNode.depth + 1, gcNode, sampleTime);
          stackStartTimes[++stackTop] = sampleTime;
          stackChildrenDuration[stackTop] = 0;
          prevId = id;
          continue;
        }
        if (prevNode === gcNode) {
          const start = stackStartTimes[stackTop];
          const duration = sampleTime - start;
          stackChildrenDuration[stackTop - 1] += duration;
          closeFrameCallback(gcParentNode.depth + 1, gcNode, start, duration, duration - stackChildrenDuration[stackTop]);
          --stackTop;
          prevNode = gcParentNode;
          prevId = prevNode.id;
          gcParentNode = null;
        }
        while (node.depth > prevNode.depth) {
          stackNodes.push(node);
          node = node.parent;
        }
        while (prevNode !== node) {
          const start = stackStartTimes[stackTop];
          const duration = sampleTime - start;
          stackChildrenDuration[stackTop - 1] += duration;
          closeFrameCallback(prevNode.depth, (prevNode), start, duration, duration - stackChildrenDuration[stackTop]);
          --stackTop;
          if (node.depth === prevNode.depth) {
            stackNodes.push(node);
            node = node.parent;
          }
          prevNode = prevNode.parent;
        }
        while (stackNodes.length) {
          node = stackNodes.pop();
          openFrameCallback(node.depth, node, sampleTime);
          stackStartTimes[++stackTop] = sampleTime;
          stackChildrenDuration[stackTop] = 0;
        }
        prevId = id;
      }
      sampleTime = timestamps[sampleIndex] || this.profileEndTime;
      if (idToNode.get(prevId) === gcNode) {
        const start = stackStartTimes[stackTop];
        const duration = sampleTime - start;
        stackChildrenDuration[stackTop - 1] += duration;
        closeFrameCallback(gcParentNode.depth + 1, node, start, duration, duration - stackChildrenDuration[stackTop]);
        --stackTop;
        prevId = gcParentNode.id;
      }
      for (let node = idToNode.get(prevId); node.parent; node = node.parent) {
        const start = stackStartTimes[stackTop];
        const duration = sampleTime - start;
        stackChildrenDuration[stackTop - 1] += duration;
        closeFrameCallback(node.depth, (node), start, duration, duration - stackChildrenDuration[stackTop]);
        --stackTop;
      }
    }
    nodeByIndex(index) {
      return this._idToNode.get(this.samples[index]) || null;
    }
  }
  ;
var Profiler = {};

  Profiler.SamplingHeapProfileModel = class extends ProfileTreeModel {
    constructor(profile, minOrdinal, maxOrdinal) {
      super();
      this.modules = profile.modules || [];
      let nodeIdToSizeMap = null;
      if (minOrdinal || maxOrdinal) {
        nodeIdToSizeMap = new Map();
        minOrdinal = minOrdinal || 0;
        maxOrdinal = maxOrdinal || Infinity;
        for (const sample of profile.samples) {
          if (sample.ordinal < minOrdinal || sample.ordinal > maxOrdinal)
            continue;
          const size = nodeIdToSizeMap.get(sample.nodeId) || 0;
          nodeIdToSizeMap.set(sample.nodeId, size + sample.size);
        }
      }
      this.initialize(translateProfileTree(profile.head));
      function translateProfileTree(root) {
        const resultRoot = new Profiler.SamplingHeapProfileNode(root);
        const sourceNodeStack = [root];
        const targetNodeStack = [resultRoot];
        while (sourceNodeStack.length) {
          const sourceNode = sourceNodeStack.pop();
          const targetNode = targetNodeStack.pop();
          targetNode.children = sourceNode.children.map(child=>{
            const targetChild = new Profiler.SamplingHeapProfileNode(child);
            if (nodeIdToSizeMap)
              targetChild.self = nodeIdToSizeMap.get(child.id) || 0;
            return targetChild;
          }
          );
          sourceNodeStack.pushAll(sourceNode.children);
          targetNodeStack.pushAll(targetNode.children);
        }
        pruneEmptyBranches(resultRoot);
        return resultRoot;
      }
      function pruneEmptyBranches(node) {
        node.children = node.children.filter(pruneEmptyBranches);
        return !!(node.children.length || node.self);
      }
    }
  }
  ;
  Profiler.ProfileType = class {
    constructor(id, name) {
      this._id = id;
      this._name = name;
      this._profiles = [];
      this._profileBeingRecorded = null;
      this._nextProfileUid = 1;
    }
    typeName() {
      return '';
    }
    nextProfileUid() {
      return this._nextProfileUid;
    }
    incrementProfileUid() {
      return this._nextProfileUid++;
    }
    hasTemporaryView() {
      return false;
    }
    fileExtension() {
      return null;
    }
    get buttonTooltip() {
      return '';
    }
    get id() {
      return this._id;
    }
    get treeItemTitle() {
      return this._name;
    }
    get name() {
      return this._name;
    }
    buttonClicked() {
      return false;
    }
    get description() {
      return '';
    }
    isInstantProfile() {
      return false;
    }
    isEnabled() {
      return true;
    }
    getProfiles() {
      function isFinished(profile) {
        return this._profileBeingRecorded !== profile;
      }
      return this._profiles.filter(isFinished.bind(this));
    }
    customContent() {
      return null;
    }
    setCustomContentEnabled(enable) {}
    getProfile(uid) {
      for (let i = 0; i < this._profiles.length; ++i) {
        if (this._profiles[i].uid === uid)
          return this._profiles[i];
      }
      return null;
    }
    loadFromFile(file) {
      let name = file.name;
      const fileExtension = this.fileExtension();
      if (fileExtension && name.endsWith(fileExtension))
        name = name.substr(0, name.length - fileExtension.length);
      const profile = this.createProfileLoadedFromFile(name);
      profile.setFromFile();
      this.setProfileBeingRecorded(profile);
      this.addProfile(profile);
      return profile.loadFromFile(file);
    }
    createProfileLoadedFromFile(title) {
      throw new Error('Needs implemented.');
    }
    addProfile(profile) {
      this._profiles.push(profile);
    }
    removeProfile(profile) {
      const index = this._profiles.indexOf(profile);
      if (index === -1)
        return;
      this._profiles.splice(index, 1);
      this._disposeProfile(profile);
    }
    _clearTempStorage() {
      for (let i = 0; i < this._profiles.length; ++i)
        this._profiles[i].removeTempFile();
    }
    profileBeingRecorded() {
      return this._profileBeingRecorded;
    }
    setProfileBeingRecorded(profile) {
      this._profileBeingRecorded = profile;
    }
    profileBeingRecordedRemoved() {}
    reset() {
      for (const profile of this._profiles.slice())
        this._disposeProfile(profile);
      this._profiles = [];
      this._nextProfileUid = 1;
    }
    _disposeProfile(profile) {
      profile.dispose();
      if (this._profileBeingRecorded === profile) {
        this.profileBeingRecordedRemoved();
        this.setProfileBeingRecorded(null);
      }
    }
  }
  Profiler.ProfileHeader = class  {
    constructor(profileType, title) {
      this._profileType = profileType;
      this.title = title;
      this.uid = profileType.incrementProfileUid();
      this._fromFile = false;
    }
    setTitle(title) {
      this.title = title;
    }
    profileType() {
      return this._profileType;
    }
    updateStatus(subtitle, wait) {
    }
    createSidebarTreeElement(dataDisplayDelegate) {
      throw new Error('Not implemented.');
    }
    createView(dataDisplayDelegate) {
      throw new Error('Not implemented.');
    }
    removeTempFile() {
      if (this._tempFile)
        this._tempFile.remove();
    }
    dispose() {}
    canSaveToFile() {
      return false;
    }
    saveToFile() {
      throw new Error('Not implemented');
    }
    loadFromFile(file) {
      throw new Error('Not implemented');
    }
    fromFile() {
      return this._fromFile;
    }
    setFromFile() {
      this._fromFile = true;
    }
    setProfile(profile) {
        this._profile = profile;
    }
  }
  ;
  Profiler.WritableProfileHeader = class extends Profiler.ProfileHeader {
    constructor(debuggerModel, type, title) {
      super(type, title || Common.UIString('Profile %d', type.nextProfileUid()));
      this._debuggerModel = debuggerModel;
      this._tempFile = null;
    }
    _onChunkTransferred(reader) {
      this.updateStatus(Common.UIString('Loading\u2026 %d%%', Number.bytesToString(this._jsonifiedProfile.length)));
    }
    _onError(reader) {
      this.updateStatus(Common.UIString(`File '%s' read error: %s`, reader.fileName(), reader.error().message));
    }
    async write(text) {
      this._jsonifiedProfile += text;
    }
    close() {}
    dispose() {
      this.removeTempFile();
    }
    createSidebarTreeElement(panel) {
      return new Profiler.ProfileSidebarTreeElement(panel,this,'profile-sidebar-tree-item');
    }
    canSaveToFile() {
      return !this.fromFile() && this._protocolProfile;
    }
    async saveToFile() {
      const fileOutputStream = new Bindings.FileOutputStream();
      this._fileName = this._fileName || `${this.profileType().typeName()}-${new Date().toISO8601Compact()}${this.profileType().fileExtension()}`;
      const accepted = await fileOutputStream.open(this._fileName);
      if (!accepted || !this._tempFile)
        return;
      const data = await this._tempFile.read();
      if (data)
        await fileOutputStream.write(data);
      fileOutputStream.close();
    }
    async loadFromFile(file) {
      this.updateStatus(Common.UIString('Loading\u2026'), true);
      const fileReader = new Bindings.ChunkedFileReader(file,10000000,this._onChunkTransferred.bind(this));
      this._jsonifiedProfile = '';
      const success = await fileReader.read(this);
      if (!success) {
        this._onError(fileReader);
        return new Error(Common.UIString('Failed to read file'));
      }
      this.updateStatus(Common.UIString('Parsing\u2026'), true);
      let error = null;
      try {
        this._profile = (JSON.parse(this._jsonifiedProfile));
        this.setProfile(this._profile);
        this.updateStatus(Common.UIString('Loaded'), false);
      } catch (e) {
        error = e;
        this.profileType().removeProfile(this);
      }
      this._jsonifiedProfile = null;
      if (this.profileType().profileBeingRecorded() === this)
        this.profileType().setProfileBeingRecorded(null);
      return error;
    }
    setProtocolProfile(profile) {
      this.setProfile(profile);
      this._protocolProfile = profile;
      this._tempFile = new Bindings.TempFile();
      this._tempFile.write([JSON.stringify(profile)]);
      if (this.canSaveToFile())
        this.dispatchEventToListeners(Profiler.ProfileHeader.Events.ProfileReceived);
    }
  }
  ;
  Profiler.SamplingHeapProfileHeader = class extends Profiler.WritableProfileHeader {
    constructor(heapProfilerModel, type, title) {
      super(heapProfilerModel && heapProfilerModel.debuggerModel(), type, title || Common.UIString('Profile %d', type.nextProfileUid()));
      this._heapProfilerModel = heapProfilerModel;
      this._protocolProfile = ({
        head: {
          callFrame: {},
          children: []
        }
      });
    }
    createView() {
      return new Profiler.HeapProfileView(this);
    }
    protocolProfile() {
      return this._protocolProfile;
    }
    heapProfilerModel() {
      return this._heapProfilerModel;
    }
  }
  ;
  Profiler.SamplingHeapProfileNode = class extends ProfileNode {
    constructor(node) {
      const callFrame = node.callFrame || ({
        functionName: node['functionName'],
        scriptId: node['scriptId'],
        url: node['url'],
        lineNumber: node['lineNumber'] - 1,
        columnNumber: node['columnNumber'] - 1
      });
      super(callFrame);
      this.self = node.selfSize;
    }
  }
  ;
  Profiler.SamplingHeapProfileModel = class extends ProfileTreeModel {
    constructor(profile, minOrdinal, maxOrdinal) {
      super();
      this.modules = profile.modules || [];
      let nodeIdToSizeMap = null;
      if (minOrdinal || maxOrdinal) {
        nodeIdToSizeMap = new Map();
        minOrdinal = minOrdinal || 0;
        maxOrdinal = maxOrdinal || Infinity;
        for (const sample of profile.samples) {
          if (sample.ordinal < minOrdinal || sample.ordinal > maxOrdinal)
            continue;
          const size = nodeIdToSizeMap.get(sample.nodeId) || 0;
          nodeIdToSizeMap.set(sample.nodeId, size + sample.size);
        }
      }
      this.initialize(translateProfileTree(profile.head));
      function translateProfileTree(root) {
        const resultRoot = new Profiler.SamplingHeapProfileNode(root);
        const sourceNodeStack = [root];
        const targetNodeStack = [resultRoot];
        while (sourceNodeStack.length) {
          const sourceNode = sourceNodeStack.pop();
          const targetNode = targetNodeStack.pop();
          targetNode.children = sourceNode.children.map(child=>{
            const targetChild = new Profiler.SamplingHeapProfileNode(child);
            if (nodeIdToSizeMap)
              targetChild.self = nodeIdToSizeMap.get(child.id) || 0;
            return targetChild;
          }
          );
          sourceNodeStack.pushAll(sourceNode.children);
          targetNodeStack.pushAll(targetNode.children);
        }
        pruneEmptyBranches(resultRoot);
        return resultRoot;
      }
      function pruneEmptyBranches(node) {
        node.children = node.children.filter(pruneEmptyBranches);
        return !!(node.children.length || node.self);
      }
    }
  }
  ;

module.exports = {
    CPUProfileDataModel,
    Profiler
};