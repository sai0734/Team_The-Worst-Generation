import type { RouteObject } from "react-router-dom";
import HospitalPage from "../pages/hospital/HospitalPage";
import HospitalReservationPage from "../pages/hospital/HospitalReservationPage";

const hospitalRouter = (): RouteObject[] => [
  {
    index: true,
    element: <HospitalPage />,
  },
  {
    path: "reservation",
    element: <HospitalReservationPage />,
  },
];

export default hospitalRouter;
