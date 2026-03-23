const LISTINGS = [
  {
    img: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400&q=80",
    price: "$1,800/mo",
    address: "Charles St, Beacon Hill",
    details: "2 bd · 1 ba",
  },
  {
    img: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400&q=80",
    price: "$2,350/mo",
    address: "Newbury St, Back Bay",
    details: "1 bd · 1 ba",
  },
  {
    img: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=400&q=80",
    price: "$1,450/mo",
    address: "Cambridge St, Allston",
    details: "3 bd · 2 ba",
  },
  {
    img: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400&q=80",
    price: "$1,800/mo",
    address: "Charles St, Beacon Hill",
    details: "2 bd · 1 ba",
  },
  {
    img: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400&q=80",
    price: "$2,350/mo",
    address: "Newbury St, Back Bay",
    details: "1 bd · 1 ba",
  },
  {
    img: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=400&q=80",
    price: "$1,450/mo",
    address: "Cambridge St, Allston",
    details: "3 bd · 2 ba",
  },
];

const PhoneMock = () => {
  return (
    <div className="relative mx-auto" style={{ width: 280, height: 570 }}>
      {/* iPhone frame */}
      <div
        className="absolute inset-0 rounded-[44px] border-[3px] z-20 pointer-events-none"
        style={{
          borderColor: "#8a8680",
          background: "transparent",
          boxShadow:
            "0 0 0 1px rgba(0,0,0,0.3), 0 25px 60px -10px rgba(0,0,0,0.5), inset 0 0 0 1px rgba(255,255,255,0.05)",
        }}
      />

      {/* Dynamic Island */}
      <div
        className="absolute top-[10px] left-1/2 -translate-x-1/2 z-30 rounded-full"
        style={{
          width: 90,
          height: 28,
          background: "#000",
        }}
      />

      {/* Screen area — clipped to rounded rect */}
      <div
        className="absolute overflow-hidden z-10"
        style={{
          top: 3,
          left: 3,
          right: 3,
          bottom: 3,
          borderRadius: 41,
          background: "#f8f8f8",
        }}
      >
        {/* Status bar */}
        <div className="flex items-center justify-between px-6 pt-[14px] pb-1 bg-white" style={{ height: 44 }}>
          <span className="text-[11px] font-semibold text-gray-900">9:41</span>
          <div className="flex items-center gap-[3px]">
            <svg width="15" height="11" viewBox="0 0 15 11" fill="none"><rect x="0" y="3" width="3" height="8" rx="0.5" fill="#1a1a1a"/><rect x="4" y="2" width="3" height="9" rx="0.5" fill="#1a1a1a"/><rect x="8" y="1" width="3" height="10" rx="0.5" fill="#1a1a1a"/><rect x="12" y="0" width="3" height="11" rx="0.5" fill="#1a1a1a"/></svg>
            <svg width="14" height="11" viewBox="0 0 14 11" fill="none"><path d="M7 2C9.76 2 12.07 3.54 13 5.5C12.07 7.46 9.76 9 7 9C4.24 9 1.93 7.46 1 5.5C1.93 3.54 4.24 2 7 2Z" stroke="#1a1a1a" strokeWidth="1"/></svg>
            <svg width="22" height="11" viewBox="0 0 22 11" fill="none"><rect x="0.5" y="0.5" width="19" height="10" rx="2" stroke="#1a1a1a" strokeWidth="0.8"/><rect x="2" y="2" width="14" height="7" rx="1" fill="#1a1a1a"/><rect x="20.5" y="3.5" width="1.5" height="4" rx="0.5" fill="#1a1a1a"/></svg>
          </div>
        </div>

        {/* Search bar */}
        <div className="px-3 pt-1 pb-2 bg-white">
          <div className="flex items-center gap-2 bg-gray-100 rounded-xl px-3 py-2">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M7 1C4.79 1 3 2.79 3 5C3 8.5 7 13 7 13C7 13 11 8.5 11 5C11 2.79 9.21 1 7 1Z" stroke="#7c3aed" strokeWidth="1.5" fill="none"/>
              <circle cx="7" cy="5" r="1.5" fill="#7c3aed"/>
            </svg>
            <span className="text-[12px] text-gray-400 font-medium">Boston, MA</span>
          </div>
        </div>

        {/* Scrolling listings */}
        <div className="relative flex-1 overflow-hidden" style={{ height: "calc(100% - 90px)" }}>
          <div className="animate-phone-scroll">
            {LISTINGS.map((listing, i) => (
              <div key={i} className="px-3 pb-3">
                <div className="bg-white rounded-2xl overflow-hidden" style={{ boxShadow: "0 1px 6px rgba(0,0,0,0.08)" }}>
                  <img
                    src={listing.img}
                    alt=""
                    className="w-full object-cover"
                    style={{ height: 120 }}
                    loading="lazy"
                  />
                  <div className="p-3">
                    <p className="text-[14px] font-bold text-gray-900">{listing.price}</p>
                    <p className="text-[11px] text-gray-500 mt-0.5">{listing.address}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">{listing.details}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Home indicator */}
        <div className="absolute bottom-[6px] left-1/2 -translate-x-1/2 w-[100px] h-[4px] rounded-full bg-black/20" />
      </div>
    </div>
  );
};

export default PhoneMock;
