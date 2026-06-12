import * as React from "react"

export function useChartTheme() {
  const [theme, setTheme] = React.useState({
    grid: "rgba(255,255,255,0.1)",
    text: "rgba(255,255,255,0.5)",
    tooltipBg: "#151729",
    tooltipBorder: "#252848",
    tooltipText: "#ffffff",
  })

  React.useEffect(() => {
    const update = () => {
      const style = getComputedStyle(document.documentElement)
      setTheme({
        grid: style.getPropertyValue("--chart-grid").trim() || "rgba(255,255,255,0.1)",
        text: style.getPropertyValue("--chart-text").trim() || "rgba(255,255,255,0.5)",
        tooltipBg: style.getPropertyValue("--chart-tooltip-bg").trim() || "#151729",
        tooltipBorder: style.getPropertyValue("--chart-tooltip-border").trim() || "#252848",
        tooltipText: style.getPropertyValue("--chart-tooltip-text").trim() || "#ffffff",
      })
    }
    update()
    // Watch for class changes on <html> to detect theme toggle
    const obs = new MutationObserver(update)
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] })
    return () => obs.disconnect()
  }, [])

  return theme
}
