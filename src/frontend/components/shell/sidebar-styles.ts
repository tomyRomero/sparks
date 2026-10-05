// The sidebar marks itself group/nav with data-expanded; these read it, so
// the first paint is right before any script runs. Below 1024px it's icons only.
export const whenExpanded = "hidden lg:group-data-[expanded=true]/nav:inline";
export const alignWhenExpanded = "justify-center lg:group-data-[expanded=true]/nav:justify-start";
