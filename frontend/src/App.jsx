import OTPLogin from "./Components/OTPLogin";
// import ProtectedPage from "./ProtectedPage";
import MoneyManager from "./Components/MoneyManager";

function App() {
  return (
    <OTPLogin>
      <MoneyManager />
    </OTPLogin>
  );
}

export default App;
