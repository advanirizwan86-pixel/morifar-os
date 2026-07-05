import {PageHeader} from "@/components/page-header";
import {systemRoutes} from "@/features/system-knowledge";
import {requireCtoSession} from "@/features/auth/session";

export default async function SystemMapPage() {
  await requireCtoSession();
  return (
    <div className="page">
      <PageHeader eyebrow="SYSTEM INVENTORY" title="System Map" subtitle="Route-by-route inventory for audit, training and release management." />
      <section className="panel">
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Route</th>
                <th>Page</th>
                <th>Purpose</th>
                <th>Module</th>
                <th>Role</th>
                <th>Status</th>
                <th>Data Source</th>
                <th>Services</th>
                <th>Components</th>
              </tr>
            </thead>
            <tbody>
              {systemRoutes.map(route => (
                <tr key={route.route}>
                  <td><strong>{route.route}</strong></td>
                  <td>{route.pageName}</td>
                  <td>{route.purpose}</td>
                  <td>{route.module}</td>
                  <td>{route.requiredRole}</td>
                  <td><span className="badge completed">{route.status}</span></td>
                  <td>{route.dataSource}</td>
                  <td>{route.relatedServices}</td>
                  <td>{route.relatedComponents}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
