import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";
import Cadastro from "./pages/Cadastro";
import EscolhaCadastro from "./pages/EscolhaCadastro";
import CadastroCliente from "./pages/CadastroCliente";
import CadastroEditor from "./pages/CadastroEditor";
import ComoFunciona from "./pages/ComoFunciona";
import TermosDeUso from "./pages/TermosDeUso";
import Editores from "./pages/Editores";
import DashboardCliente from "./pages/DashboardCliente";
import DashboardEditor from "./pages/DashboardEditor";
import CandidaturaEditor from "./pages/CandidaturaEditor";
import PerfilEditor from "./pages/PerfilEditor";
import Briefing from "./pages/Briefing";
import Chat from "./pages/Chat";
import DashboardAdmin from "./pages/DashboardAdmin";
import Pagamento from "./pages/Pagamento";
import PagamentoRetorno from "./pages/PagamentoRetorno";
import JornadaEditor from "./pages/JornadaEditor";
import Calculadora from "./pages/Calculadora";
import { AvaliacaoEditor, AvaliacaoCliente } from "./pages/Avaliacao";
import ModoRecorrente from "./pages/ModoRecorrente";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/cadastro" element={<EscolhaCadastro />} />
            <Route path="/cadastro/cliente" element={<CadastroCliente />} />
            <Route path="/cadastro/editor" element={<CadastroEditor />} />
            <Route path="/como-funciona" element={<ComoFunciona />} />
            <Route path="/termos" element={<TermosDeUso />} />
            <Route path="/privacidade" element={<TermosDeUso />} />
            <Route path="/editores" element={<Editores />} />
            <Route path="/dashboard/cliente" element={<DashboardCliente />} />
            <Route path="/dashboard/editor" element={<DashboardEditor />} />
            <Route path="/candidatura" element={<CandidaturaEditor />} />
            <Route path="/editor/:id" element={<PerfilEditor />} />
            <Route path="/briefing/:editorId" element={<Briefing />} />
            <Route path="/chat/:orderId" element={<Chat />} />
            <Route path="/admin" element={<DashboardAdmin />} />
            <Route path="/pagamento/:orderId" element={<Pagamento />} />
            <Route path="/pagamento/retorno" element={<PagamentoRetorno />} />
            <Route path="/jornada" element={<JornadaEditor />} />
            <Route path="/calculadora" element={<Calculadora />} />
            <Route path="/avaliar/editor/:orderId" element={<AvaliacaoEditor />} />
            <Route path="/avaliar/cliente/:orderId" element={<AvaliacaoCliente />} />
            <Route path="/recorrente" element={<ModoRecorrente />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
