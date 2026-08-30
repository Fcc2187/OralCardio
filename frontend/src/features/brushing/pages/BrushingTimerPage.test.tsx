import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { BrushingTimerPage } from "./BrushingTimerPage";

const useAuthMock = vi.fn();
vi.mock("@/shared/auth/authContext", () => ({
  useAuth: () => useAuthMock(),
}));

const mockStart = vi.fn();
const mockPause = vi.fn();
const mockResumeTimer = vi.fn();
const mockResumeFrom = vi.fn();

let mockTimerStatus = "idle";
let mockCurrentZone: string | null = "upper_right";
let mockCompletedZones: string[] = [];
let mockSecondsRemainingInZone = 24;
let mockFormattedSeconds = "0:24";
let mockProgressPercent = 0;

vi.mock("../useBrushingTimer", () => ({
  useBrushingTimer: () => ({
    status: mockTimerStatus,
    currentZone: mockCurrentZone,
    secondsElapsedInZone: 24 - mockSecondsRemainingInZone,
    secondsRemainingInZone: mockSecondsRemainingInZone,
    formattedSecondsRemainingInZone: mockFormattedSeconds,
    totalElapsedSeconds: 0,
    progressPercent: mockProgressPercent,
    completedZones: mockCompletedZones,
    start: mockStart,
    resumeFrom: mockResumeFrom,
    pause: mockPause,
    resume: mockResumeTimer,
  }),
}));

const mockSessionStart = vi.fn();
const mockSessionResume = vi.fn();
const mockPersistZone = vi.fn();
const mockFinish = vi.fn();
const mockRetryFinish = vi.fn();
const mockRetryPendingZones = vi.fn();

let mockIsStarting = false;
let mockIsSaving = false;
let mockIsComplete = false;
let mockStartError: string | null = null;
let mockSaveError: string | null = null;
let mockRecoverableSession: unknown = null;

vi.mock("../useBrushingSessionController", () => ({
  useBrushingSessionController: () => ({
    isStarting: mockIsStarting,
    isSaving: mockIsSaving,
    isComplete: mockIsComplete,
    startError: mockStartError,
    saveError: mockSaveError,
    recoverableSession: mockRecoverableSession,
    start: mockSessionStart,
    persistZone: mockPersistZone,
    retryPendingZones: mockRetryPendingZones,
    finish: mockFinish,
    retryFinish: mockRetryFinish,
    resume: mockSessionResume,
  }),
}));

function renderPage() {
  return render(
    <MemoryRouter>
      <BrushingTimerPage />
    </MemoryRouter>,
  );
}

describe("BrushingTimerPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthMock.mockReturnValue({ user: { id: "user-1" } });
    mockTimerStatus = "idle";
    mockCurrentZone = "upper_right";
    mockCompletedZones = [];
    mockSecondsRemainingInZone = 24;
    mockFormattedSeconds = "0:24";
    mockProgressPercent = 0;
    mockIsStarting = false;
    mockIsSaving = false;
    mockIsComplete = false;
    mockStartError = null;
    mockSaveError = null;
    mockRecoverableSession = null;
  });

  it("renderiza o estado inicial (idle) com título e instruções", () => {
    renderPage();

    const heading = screen.getByRole("heading", { name: "Hora de escovar" });
    expect(heading).toBeInTheDocument();
    expect(document.title).toBe("Hora de escovar — OralCardio");
    expect(heading).toHaveFocus();
    expect(screen.getByText("2 minutos, 5 zonas da boca")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Começar" })).toBeInTheDocument();
    expect(screen.getByText(/Vamos guiar você por cada zona da boca/)).toBeInTheDocument();
  });

  it("dispara início de sessão ao clicar em Começar", async () => {
    mockSessionStart.mockResolvedValueOnce({ id: "session-1" });
    renderPage();

    fireEvent.click(screen.getByRole("button", { name: "Começar" }));
    expect(mockSessionStart).toHaveBeenCalledOnce();
    await waitFor(() => expect(mockStart).toHaveBeenCalledOnce());
  });

  it("renderiza o estado em andamento com timer formatado, pílula de orientação e card de progresso", () => {
    mockTimerStatus = "running";
    mockCurrentZone = "upper_right";
    mockFormattedSeconds = "0:21";
    mockProgressPercent = 15;
    mockCompletedZones = [];

    renderPage();

    expect(screen.getByRole("heading", { name: "Escovando" })).toBeInTheDocument();
    expect(screen.getByText("Superior direito")).toBeInTheDocument();
    expect(screen.getByText("0:21")).toBeInTheDocument();
    expect(screen.getByText("Tempo total")).toBeInTheDocument();
    expect(screen.getByText("Regiões")).toBeInTheDocument();
    expect(screen.getByText("Movimentos suaves e circulares")).toBeInTheDocument();
    expect(screen.getByRole("progressbar", { name: "Progresso da escovação" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Pausar" })).toBeInTheDocument();
  });

  it("abre o modal de dicas ao clicar no botão Dicas", () => {
    mockTimerStatus = "running";
    renderPage();

    fireEvent.click(screen.getByRole("button", { name: "Dicas" }));
    expect(screen.getByRole("dialog", { name: "Dicas de Escovação" })).toBeInTheDocument();
    expect(mockPause).toHaveBeenCalledOnce();

    fireEvent.click(screen.getByRole("button", { name: "Entendi" }));
    expect(mockResumeTimer).toHaveBeenCalledOnce();
  });

  it("não retoma o timer ao fechar dicas que foram abertas com a escovação pausada", () => {
    mockTimerStatus = "paused";
    renderPage();

    fireEvent.click(screen.getByRole("button", { name: "Dicas" }));
    fireEvent.click(screen.getByRole("button", { name: "Entendi" }));

    expect(mockPause).not.toHaveBeenCalled();
    expect(mockResumeTimer).not.toHaveBeenCalled();
  });

  it("recupera a sessão interrompida pelo ponto salvo", () => {
    mockRecoverableSession = { id: "session-1" };
    mockSessionResume.mockReturnValue({ zones_completed: ["upper_right"] });
    renderPage();

    fireEvent.click(screen.getByRole("button", { name: "Retomar escovação" }));

    expect(mockResumeFrom).toHaveBeenCalledWith(["upper_right"]);
  });

  it("permite tentar novamente quando a sincronização de uma zona falha", () => {
    mockTimerStatus = "running";
    mockSaveError = "Falha na sincronização.";
    renderPage();

    fireEvent.click(screen.getByRole("button", { name: "Tentar sincronizar" }));

    expect(mockRetryPendingZones).toHaveBeenCalledOnce();
  });

  it("permite tentar salvar novamente após concluir a escovação", () => {
    mockTimerStatus = "finished";
    mockSaveError = "Falha ao finalizar.";
    renderPage();

    fireEvent.click(screen.getByRole("button", { name: "Tentar novamente" }));

    expect(mockRetryFinish).toHaveBeenCalledOnce();
  });

  it("exibe erro ao iniciar uma sessão", () => {
    mockStartError = "Não foi possível iniciar a escovação.";
    renderPage();

    expect(screen.getByText("Não foi possível iniciar a escovação.")).toBeInTheDocument();
  });

  it("pausa e retoma a sessão pelo botão de ação", () => {
    mockTimerStatus = "running";
    const { rerender } = renderPage();

    fireEvent.click(screen.getByRole("button", { name: "Pausar" }));
    expect(mockPause).toHaveBeenCalledOnce();

    mockTimerStatus = "paused";
    rerender(
      <MemoryRouter>
        <BrushingTimerPage />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Continuar" }));
    expect(mockResumeTimer).toHaveBeenCalledOnce();
  });

  it("renderiza o estado finalizado com sucesso quando completo", () => {
    mockTimerStatus = "finished";
    mockIsComplete = true;

    renderPage();

    expect(screen.getByRole("heading", { name: "Escovação concluída!" })).toBeInTheDocument();
    expect(screen.getByText("Muito bem!")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Voltar ao início" })).toBeInTheDocument();
  });
});
