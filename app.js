const state = {
  expressionText: "n**2",
  density: 0,
  xMin: 1,
  xMax: 20,
  autoTimer: null,
};

const elements = {
  densitySlider: document.querySelector("#densitySlider"),
  densityValue: document.querySelector("#densityValue"),
  autoDemoButton: document.querySelector("#autoDemoButton"),
  errorBox: document.querySelector("#errorBox"),
  sequenceChart: document.querySelector("#sequenceChart"),
  differenceChart: document.querySelector("#differenceChart"),
  sequenceFormula: document.querySelector("#sequenceFormula"),
  functionFormula: document.querySelector("#functionFormula"),
  differenceFormula: document.querySelector("#differenceFormula"),
  derivativeFormula: document.querySelector("#derivativeFormula"),
  visualForm: document.querySelector("#visualForm"),
  expressionInput: document.querySelector("#expressionInput"),
  xMinInput: document.querySelector("#xMinInput"),
  xMaxInput: document.querySelector("#xMaxInput"),
};

function normalizeExpression(expressionText) {
  return expressionText.trim().replace(/\*\*/g, "^");
}

function parseSequenceExpression(expressionText) {
  if (!expressionText.trim()) {
    throw new Error("请输入一个数列表达式，例如 n**2。");
  }

  const normalized = normalizeExpression(expressionText);
  const node = math.parse(normalized);
  const symbols = new Set();

  node.traverse((child) => {
    if (child.isSymbolNode) {
      symbols.add(child.name);
    }
  });

  const builtInSymbols = new Set(["e", "E", "pi", "PI", "Infinity", "NaN"]);
  const unsupported = [...symbols].filter((name) => {
    const maybeFunction = typeof math[name] === "function";
    return name !== "n" && name !== "x" && !builtInSymbols.has(name) && !maybeFunction;
  });

  if (unsupported.length > 0) {
    throw new Error(`表达式中包含未支持的变量：${unsupported.join("、")}。请使用 n 作为自变量。`);
  }

  return normalizeExpression(normalized.replace(/\bx\b/g, "n"));
}

function validateVariableRange(xMin, xMax) {
  if (!Number.isFinite(xMin) || !Number.isFinite(xMax)) {
    throw new Error("自变量范围必须是有限数字。");
  }
  if (xMin >= xMax) {
    throw new Error("自变量起点必须小于终点。");
  }
  if (xMax - xMin < 1) {
    throw new Error("自变量区间长度至少为 1，才能显示相邻项差分。");
  }
  if (xMax - xMin > 1000) {
    throw new Error("自变量范围过大，请将区间长度控制在 1000 以内。");
  }
}

function densityToStep(density) {
  const clampedDensity = Math.min(Math.max(density, 0), 10);
  return 1 / (clampedDensity + 1);
}

function compileExpression(expressionText) {
  const normalizedExpression = parseSequenceExpression(expressionText);
  const functionExpression = normalizedExpression.replace(/\bn\b/g, "x");
  const sequenceCode = math.compile(normalizedExpression);
  const functionCode = math.compile(functionExpression);
  const derivativeExpression = math.derivative(functionExpression, "x").toString();
  const differenceExpression = buildDifferenceExpression(normalizedExpression);

  return {
    normalizedExpression,
    functionExpression,
    sequenceCode,
    functionCode,
    derivativeExpression,
    differenceExpression,
  };
}

function buildDifferenceExpression(normalizedExpression) {
  const sourceNode = math.parse(normalizedExpression);
  const shiftedNode = sourceNode.transform((node) => {
    if (node.isSymbolNode && node.name === "n") {
      return math.parse("(n + 1)");
    }
    return node;
  });
  return math.simplify(`(${shiftedNode.toString()}) - (${sourceNode.toString()})`).toString();
}

function evaluateCompiled(compiled, variableName, value) {
  const result = compiled.evaluate({ [variableName]: value });
  if (typeof result === "number") {
    return Number.isFinite(result) ? result : null;
  }
  if (math.typeOf(result) === "Complex") {
    return Math.abs(result.im) < 1e-9 && Number.isFinite(result.re) ? result.re : null;
  }
  const numericResult = Number(result);
  return Number.isFinite(numericResult) ? numericResult : null;
}

function makeRange(start, stop, step) {
  const values = [];
  const safeStep = Math.max(step, 1e-6);
  for (let value = start; value <= stop + safeStep / 2; value += safeStep) {
    values.push(Number(value.toFixed(10)));
    if (values.length > 120000) {
      break;
    }
  }
  return values;
}

function integerPointsInRange(xMin, xMax, includeEndpoint = true) {
  const start = Math.ceil(xMin);
  const stop = Math.floor(includeEndpoint ? xMax : xMax - 1);
  if (stop < start) {
    return [];
  }
  return makeRange(start, stop, 1);
}

function getValidPoints(values, evaluator) {
  const xValues = [];
  const yValues = [];

  values.forEach((value) => {
    const result = evaluator(value);
    if (result !== null) {
      xValues.push(value);
      yValues.push(result);
    }
  });

  return { xValues, yValues };
}

function markerSize(density) {
  return Math.max(1.8, 5.2 - density * 0.28);
}

function commonLayout(xTitle, yTitle) {
  return {
    height: 460,
    margin: { l: 52, r: 24, t: 36, b: 48 },
    paper_bgcolor: "#ffffff",
    plot_bgcolor: "#ffffff",
    legend: {
      orientation: "h",
      yanchor: "bottom",
      y: 1.02,
      xanchor: "left",
      x: 0,
    },
    xaxis: {
      title: xTitle,
      zeroline: false,
      gridcolor: "#e5e7eb",
    },
    yaxis: {
      title: yTitle,
      zeroline: false,
      gridcolor: "#e5e7eb",
    },
    font: {
      family: "-apple-system, BlinkMacSystemFont, Segoe UI, PingFang SC, Microsoft YaHei, sans-serif",
      color: "#111827",
    },
  };
}

function buildSequenceChart(compiled) {
  const integerValues = integerPointsInRange(state.xMin, state.xMax);
  const integerPoints = getValidPoints(integerValues, (value) =>
    evaluateCompiled(compiled.functionCode, "x", value),
  );

  const traces = [
    {
      x: integerPoints.xValues,
      y: integerPoints.yValues,
      mode: "markers",
      type: "scatter",
      name: "整数点 a_n",
      marker: {
        size: 6,
        color: "#2563eb",
        line: { width: 1, color: "#ffffff" },
      },
      hovertemplate: "n=%{x}<br>a_n=%{y:.4g}<extra></extra>",
    },
  ];

  if (state.density > 0) {
    const step = densityToStep(state.density);
    const sampleValues = makeRange(state.xMin, state.xMax, step);
    const samplePoints = getValidPoints(sampleValues, (value) =>
      evaluateCompiled(compiled.functionCode, "x", value),
    );

    traces.push({
      x: samplePoints.xValues,
      y: samplePoints.yValues,
      mode: "markers",
      type: "scatter",
      name: "稠密化采样 f(x)",
      marker: {
        size: markerSize(state.density),
        color: "#14b8a6",
      },
      hovertemplate: "x=%{x:.3g}<br>f(x)=%{y:.4g}<extra></extra>",
    });
  }

  Plotly.react(elements.sequenceChart, traces, commonLayout("输入值", "函数值"), {
    responsive: true,
    displaylogo: false,
  });
}

function buildDifferenceChart(compiled) {
  const integerValues = integerPointsInRange(state.xMin, state.xMax, false);
  const integerPoints = getValidPoints(integerValues, (value) => {
    const currentValue = evaluateCompiled(compiled.functionCode, "x", value);
    const nextValue = evaluateCompiled(compiled.functionCode, "x", value + 1);
    return currentValue === null || nextValue === null ? null : nextValue - currentValue;
  });

  const traces = [
    {
      x: integerPoints.xValues,
      y: integerPoints.yValues,
      mode: "markers",
      type: "scatter",
      name: "差分 Δa_n",
      marker: {
        size: 6,
        color: "#f97316",
        line: { width: 1, color: "#ffffff" },
      },
      hovertemplate: "n=%{x}<br>Δa_n=%{y:.4g}<extra></extra>",
    },
  ];

  if (state.density > 0) {
    const h = densityToStep(state.density);
    const sampleValues = makeRange(state.xMin, state.xMax, h);
    const samplePoints = getValidPoints(sampleValues, (value) => {
      const currentValue = evaluateCompiled(compiled.functionCode, "x", value);
      const nextValue = evaluateCompiled(compiled.functionCode, "x", value + h);
      return currentValue === null || nextValue === null ? null : (nextValue - currentValue) / h;
    });

    traces.push({
      x: samplePoints.xValues,
      y: samplePoints.yValues,
      mode: "markers",
      type: "scatter",
      name: "差分稠密化采样",
      marker: {
        size: markerSize(state.density),
        color: "#ef4444",
      },
      hovertemplate: "x=%{x:.3g}<br>变化率≈%{y:.4g}<extra></extra>",
    });
  }

  Plotly.react(elements.differenceChart, traces, commonLayout("输入值", "变化率"), {
    responsive: true,
    displaylogo: false,
  });
}

function renderFormulas(compiled) {
  elements.sequenceFormula.textContent = `a_n = ${compiled.normalizedExpression}`;
  elements.functionFormula.textContent = `f(x) = ${compiled.functionExpression}`;
  elements.differenceFormula.textContent = `Δa_n = ${compiled.differenceExpression}`;
  elements.derivativeFormula.textContent = `f'(x) = ${compiled.derivativeExpression}`;
}

function showError(message) {
  elements.errorBox.textContent = `输入错误：${message}`;
  elements.errorBox.hidden = false;
}

function clearError() {
  elements.errorBox.textContent = "";
  elements.errorBox.hidden = true;
}

function validateRenderableExpression(compiled, xMin, xMax) {
  const values = makeRange(xMin, xMax, Math.max((xMax - xMin) / 30, 0.01));
  const validValues = values.filter((value) => evaluateCompiled(compiled.functionCode, "x", value) !== null);
  if (validValues.length === 0) {
    throw new Error("当前表达式在所选自变量范围内没有可显示的实数值。");
  }
}

function render() {
  const compiled = compileExpression(state.expressionText);
  buildSequenceChart(compiled);
  buildDifferenceChart(compiled);
  renderFormulas(compiled);
  elements.densityValue.textContent = `新增点=${state.density}, h=1/${state.density + 1}`;
  elements.densitySlider.value = String(state.density);
}

function handleSubmit(event) {
  event.preventDefault();
  const nextExpression = elements.expressionInput.value;
  const nextXMin = Number(elements.xMinInput.value);
  const nextXMax = Number(elements.xMaxInput.value);

  try {
    validateVariableRange(nextXMin, nextXMax);
    const compiled = compileExpression(nextExpression);
    validateRenderableExpression(compiled, nextXMin, nextXMax);

    state.expressionText = nextExpression;
    state.xMin = nextXMin;
    state.xMax = nextXMax;
    state.density = 0;
    stopAutoDemo();
    clearError();
    render();
  } catch (error) {
    stopAutoDemo();
    showError(error.message);
  }
}

function handleDensityChange() {
  state.density = Number(elements.densitySlider.value);
  elements.densityValue.textContent = `新增点=${state.density}, h=1/${state.density + 1}`;
  clearError();
  render();
}

function stopAutoDemo() {
  if (state.autoTimer !== null) {
    window.clearInterval(state.autoTimer);
    state.autoTimer = null;
  }
  elements.autoDemoButton.disabled = false;
}

function startAutoDemo() {
  stopAutoDemo();
  state.density = 0;
  clearError();
  render();
  elements.autoDemoButton.disabled = true;

  state.autoTimer = window.setInterval(() => {
    if (state.density >= 10) {
      stopAutoDemo();
      return;
    }
    state.density += 1;
    render();
  }, 900);
}

elements.visualForm.addEventListener("submit", handleSubmit);
elements.densitySlider.addEventListener("input", handleDensityChange);
elements.autoDemoButton.addEventListener("click", startAutoDemo);
window.addEventListener("resize", () => {
  Plotly.Plots.resize(elements.sequenceChart);
  Plotly.Plots.resize(elements.differenceChart);
});

render();
