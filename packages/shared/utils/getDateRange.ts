export function getDateRange(period: string) {
  const now = new Date();
  let from: Date | undefined;
  let to: Date | undefined;

  switch (period) {
    case "today":
      from = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      to = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
      break;
    case "yesterday":
      from = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
      to = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      break;
    case "last7days":
      from = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6);
      to = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
      break;
    case "thismonth":
      from = new Date(now.getFullYear(), now.getMonth(), 1);
      to = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      break;
    case "lastmonth":
      from = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      to = new Date(now.getFullYear(), now.getMonth(), 1);
      break;
    case "thisyear":
      from = new Date(now.getFullYear(), 0, 1);
      to = new Date(now.getFullYear() + 1, 0, 1);
      break;
    case "alltime":
    default:
      from = undefined;
      to = undefined;
      break;
  }
  return { from, to };
}

