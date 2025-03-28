let abilityPanel;

function json2panel(json) {
  return [
    { index: 0, name: "", energy: 0, x: 0, y: 0 },
    ...json.map((item, index) => ({
      id: item[0],
      index: index + 1,
      name: item[1],
      energy: item[3],
      lv: item[5],
      x: item[7],
      y: item[8],
    })),
  ];
}

window.slv = 5;

function autoPanel(key) {
  let slv = prompt(
    "自動石盤僅供參考\n確定要覆蓋當前石盤嗎？\n請輸入招式等級",
    window.slv
  );
  if (!slv || isNaN(slv)) return;
  slv = Number(slv);
  window.slv = slv;
  if (!abilityPanel) abilityPanel = json2panel(json);

  let tempAbilityPanel = abilityPanel
    .filter((i) => i.lv <= slv || !i.lv)
    .map((i, index) => ({ ...i, rawIndex: i.index, index }));

  let n = tempAbilityPanel.length;

  let w = tempAbilityPanel.map((item) => item.energy);

  let neighbours = tempAbilityPanel.map((i) =>
    tempAbilityPanel
      .filter((j) => {
        let dx = i.x - j.x;
        let dy = i.y - j.y;
        if (dx == 0 && Math.abs(dy) == 1) return true;
        if (dy == 0 && Math.abs(dx) == 1) return true;
        if (dx + dy == 0 && Math.abs(dx) == 1 && Math.abs(dy) == 1) return true;
      })
      .map((item) => item.index)
  );

  let include;
  if (key)
    include = tempAbilityPanel
      .filter(
        (item) =>
          item.name.match(/拍組招式(?!後).*(威力)?(隨.+)?(提升|↑)/) ||
          item.name.match(/^擊中要害時威力提升/) ||
          item.name.match(new RegExp(`${key}：威力\\+\\d+`))
      )
      .map((i) => i.index);
  else
    include = Array.from(checks[set])
      .map((item, index) => ({ item, index }))
      .map((i) => {
        let index = tempAbilityPanel.find(
          (x) => x.rawIndex == i.index + 1
        )?.index;
        if (
          i.item == "1" &&
          !(
            neighbours[0].includes(index) && tempAbilityPanel[index].energy == 0
          )
        )
          return index;
      })
      .filter((i) => i != undefined);

  let k = include.length;

  if (k > 14) {
    alert("選中格子過多，請減少選中格子后重試");
    return;
  }

  let dp = new Array();
  let pre = new Array();
  for (let i = 0; i < n; i++) {
    let dpArr = new Array(1 << k);
    pre.push(new Array(1 << k));
    for (let j = 0; j < 1 << k; j++) dpArr[j] = Infinity;
    dp.push(dpArr);
  }
  for (let i = 0; i < k; i++) dp[include[i]][1 << i] = 0;

  let q = [];

  for (let s = 1; s < 1 << k; s++) {
    for (let i = 0; i < n; i++) {
      for (let j = (s - 1) & s; j > 0; j = (j - 1) & s) {
        if (dp[i][j] + dp[i][s ^ j] - w[i] < dp[i][s]) {
          dp[i][s] = dp[i][j] + dp[i][s ^ j] - w[i];
          pre[i][s] = [i, j];
        }
      }
      if (dp[i][s] < Infinity) q.push(i);
    }
    spfa(s);
  }

  let ans = new Array(n);
  for (let i = 0; i < n; i++) ans[i] = 0;
  dfs(0, (1 << k) - 1);

  let result = ans
    .map((item, index) => ({ item, index }))
    .filter((i) => i.item)
    .map((i) => i.index);
  for (let i of result) {
    for (let j of neighbours[i]) {
      if (!result.includes(j) && w[j] == 0) {
        result.push(j);
      }
    }
  }
  if (key) {
    for (i of include) if (!result.includes(i)) result.push(i);
    checks[set] = "";
    update();
    newGrid();
  }
  result = result
    .map((i) => tempAbilityPanel[i])
    .map((i) => ({ ...i, index: i.rawIndex }));
  result.forEach((item) => {
    if (item.id && check[item.index - 1] != 1) c(undefined, item.id);
  });
  return result;

  function spfa(s) {
    let inq = new Array(n);
    for (let i = 0; i < n; i++) inq[i] = false;
    while (q.length > 0) {
      let u = q.shift();
      inq[u] = false;
      for (let v of neighbours[u]) {
        if (dp[v][s] > dp[u][s] + w[v]) {
          dp[v][s] = dp[u][s] + w[v];
          if (!inq[v]) {
            q.push(v);
            inq[v] = true;
          }
          pre[v][s] = [u, s];
        }
      }
    }
  }

  function dfs(u, s) {
    if (!pre[u][s]?.at(1)) return;
    ans[u] = 1;
    if (pre[u][s][0] == u) dfs(u, s ^ pre[u][s][1]);
    dfs(pre[u][s][0], pre[u][s][1]);
  }
}
