export default function DashboardCard({
  title,
  value,
}) {
  return (
    <div className="bg-white shadow rounded-xl p-5">
      <h3 className="text-gray-500 text-sm">
        {title}
      </h3>

      <p className="text-3xl font-bold mt-2">
        {value}
      </p>
    </div>
  );
}