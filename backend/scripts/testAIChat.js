async function ask(message) {
  const api = process.env.API_URL || "http://localhost:5000/api/v1";
  try {
    const res = await fetch(`${api}/ai/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message }),
    });
    const data = await res.json();
    return data;
  } catch (e) {
    return { success: false, error: e.message };
  }
}

async function run() {
  const cases = [
    "Quy trình đặt gia sư thế nào?",
    "Thanh toán xong điều gì xảy ra?",
    "Tôi cần gia sư Toán ở Hà Nội",
    "1",
  ];
  for (const c of cases) {
    const res = await ask(c);
    console.log("\n=== Q:", c);
    console.log("A:", res?.message || res);
    if (res?.items) console.log("items:", res.items.map(i => i.name));
  }
}

run();


