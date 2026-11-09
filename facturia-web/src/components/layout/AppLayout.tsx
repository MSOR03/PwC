import { NavLink, Outlet } from "react-router";

const links=[
    {to:'/facturas', label: 'Facturas',end: true,},
    {to:'/facturas/nueva', label: 'Cargar factura', end: false},
    {to:'/reportes', label: 'Reportes', end: false}
]


export function AppLayout() {
  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-logo">F</span>
          FacturIA
        </div>
        <nav aria-label="Principal">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
            >
              {link.label}
            </NavLink>
          ))}
        </nav>
      </aside>
      <main className="content">
        <Outlet />
      </main>
    </div>
  );
}