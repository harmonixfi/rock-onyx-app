import { DashboardsTemplate } from '@/components/dashboard';
import HomeNavbar from '@/components/shared/navbar/HomeNavbar';

export default async function MainDashboard() {
  return (
    <div className="max-w-[90%] mx-auto">
      <HomeNavbar />
      <div className="w-full flex flex-col items-center gap-6 pb-24">
        <h3 className="text-2xl sm:text-3xl 2xl:text-4xl font-bold uppercase mt-0 sm:mt-12 mb-8">
          Dashboard
        </h3>
        <DashboardsTemplate />
      </div>
    </div>
  );
}