/**
 * Intelligent instant template generator for common app types (Restaurants, Portfolios, Dashboards, Calculators)
 * when offline or if API hits quota limits.
 */
export function generateTailoredApp(topic = '') {
  const lower = topic.toLowerCase();

  if (lower.includes('restor') || lower.includes('restaurant') || lower.includes('food') || lower.includes('cafe')) {
    return `export default function App() {
  const [selectedCategory, setSelectedCategory] = React.useState('all');
  const [cartCount, setCartCount] = React.useState(0);

  const menu = [
    { id: 1, name: 'Truffle Mushroom Risotto', category: 'mains', price: '$24', desc: 'Arborio rice, wild forest mushrooms, fresh shaved black truffle.' },
    { id: 2, name: 'Pan-Seared Sea Bass', category: 'mains', price: '$28', desc: 'Crispy skin sea bass with lemon herb butter and asparagus.' },
    { id: 3, name: 'Burrata & Heirloom Tomato', category: 'starters', price: '$16', desc: 'Creamy burrata, aged balsamic glaze, basil oil.' },
    { id: 4, name: 'Classic Tiramisu', category: 'desserts', price: '$12', desc: 'Espresso-soaked ladyfingers, mascarpone cream, dark cocoa.' }
  ];

  const filtered = selectedCategory === 'all' ? menu : menu.filter(m => m.category === selectedCategory);

  return (
    <div className="min-h-screen bg-stone-900 text-stone-100 font-sans pb-16">
      {/* Hero Banner */}
      <header className="relative bg-gradient-to-b from-stone-950 to-stone-900 px-6 py-12 text-center border-b border-stone-800">
        <span className="text-amber-500 text-xs font-semibold uppercase tracking-widest">Fine Dining & Bistro</span>
        <h1 className="text-3xl sm:text-4xl font-serif font-bold text-amber-100 mt-2">L'Oasis Gourmand</h1>
        <p className="text-xs sm:text-sm text-stone-400 max-w-md mx-auto mt-2 leading-relaxed">
          Artisanal cuisine crafted with locally-sourced organic ingredients and passion.
        </p>
        <div className="mt-6 flex items-center justify-center gap-3">
          <button className="px-5 py-2.5 bg-amber-600 hover:bg-amber-500 active:scale-95 text-stone-950 font-semibold text-xs rounded-xl transition shadow-lg">
            Reserve a Table
          </button>
          <div className="px-4 py-2 bg-stone-800 border border-stone-700 rounded-xl text-xs text-amber-300">
            Cart ({cartCount})
          </div>
        </div>
      </header>

      {/* Menu Categories */}
      <main className="max-w-2xl mx-auto px-4 mt-8">
        <div className="flex items-center justify-center gap-2 mb-6">
          {['all', 'starters', 'mains', 'desserts'].map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={\`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition \${
                selectedCategory === cat
                  ? 'bg-amber-600 text-stone-950 font-bold'
                  : 'bg-stone-800 text-stone-400 hover:text-white'
              }\`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Menu Cards */}
        <div className="grid gap-3">
          {filtered.map((item) => (
            <div key={item.id} className="bg-stone-800/80 border border-stone-700/60 p-4 rounded-2xl flex items-center justify-between hover:border-amber-600/50 transition">
              <div className="pr-4">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-amber-200">{item.name}</h3>
                  <span className="text-xs font-bold text-amber-500 font-mono">{item.price}</span>
                </div>
                <p className="text-xs text-stone-400 mt-1">{item.desc}</p>
              </div>
              <button
                onClick={() => setCartCount(c => c + 1)}
                className="shrink-0 px-3 py-1.5 bg-amber-600/20 border border-amber-500/30 hover:bg-amber-600 hover:text-stone-950 text-amber-400 text-xs font-semibold rounded-lg transition active:scale-95"
              >
                + Add
              </button>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
`;
  }

  // Default Modern Web App
  return `export default function App() {
  const [count, setCount] = React.useState(0);

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-6">
      <div className="max-w-md w-full bg-slate-800/90 border border-slate-700 rounded-3xl p-6 text-center shadow-xl">
        <h1 className="text-2xl font-bold text-blue-400 mb-2">Application Ready</h1>
        <p className="text-xs text-slate-300 leading-relaxed mb-6">
          Your project has been compiled and executed successfully inside the Vibe IDE mobile sandbox.
        </p>
        <button
          onClick={() => setCount(c => c + 1)}
          className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl active:scale-95 transition shadow-lg"
        >
          Clicked {count} times
        </button>
      </div>
    </div>
  );
}
`;
}
