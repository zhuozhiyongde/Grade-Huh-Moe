'use client';

type FooterProps = {
  onShowEula: () => void;
};

export function Footer({ onShowEula }: FooterProps) {
  const showCalculator = () => {
    const input = window.prompt("输入分数 (60 ~ 100）或绩点（1 ~ 4）来换算");
    if (!input) return;
    const x = Number(input);
    if (Number.isNaN(x)) {
      window.alert("输入不合法。");
      return;
    }
    if (x >= 60 && x <= 100) {
      const y = 4 - (3 * Math.pow(100 - x, 2)) / 1600;
      window.alert(`GPA(${x.toFixed(2)}) ≈ ${y.toFixed(2)}`);
    } else if (x >= 1 && x <= 4) {
      const y = 100 - Math.sqrt((1600 / 3) * (4 - x));
      window.alert(`GPA(${y.toFixed(2)}) ≈ ${x.toFixed(2)}`);
    } else {
      window.alert("输入不合法。");
    }
  };

  return (
    <footer id="footer">
      <p>
        绩点公式{" "}
        <button type="button" onClick={showCalculator}>
          GPA(<i>x</i>) = 4 - 3 × (100 - <i>x</i>)<sup>2</sup> ÷ 1600
        </button>
      </p>
      <br />
      <p>学期 GPA 和总 GPA 为公式计算所得，请以学校官方结果为准！</p>
      <p>
        基于{" "}
        <a
          href="https://www.gnu.org/licenses/gpl-3.0.zh-cn.html"
          target="_blank"
          rel="noopener noreferrer"
        >
          GPLv3
        </a>{" "}
        协议在{" "}
        <a
          href="https://github.com/zhuozhiyongde/Grade-Huh-Moe"
          target="_blank"
          rel="noopener noreferrer"
        >
          GitHub
        </a>{" "}
        开源 ·{" "}
        <a
          role="button"
          tabIndex={0}
          onClick={onShowEula}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              onShowEula();
            }
          }}
        >
          用户须知
        </a>
      </p>
    </footer>
  );
}
