from pydantic import BaseModel, EmailStr
from typing import Optional, List, Any
from datetime import datetime


# ── Auth ──────────────────────────────────────────────────────────────────────

class LoginRequest(BaseModel):
    email: str
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str
    user: dict


# ── Vendedor ──────────────────────────────────────────────────────────────────

class VendedorBase(BaseModel):
    nombre: str
    email: str
    telefono: Optional[str] = None


class VendedorCreate(VendedorBase):
    password: str


class VendedorUpdate(BaseModel):
    nombre: Optional[str] = None
    email: Optional[str] = None
    telefono: Optional[str] = None
    activo: Optional[bool] = None


class VendedorOut(VendedorBase):
    id: int
    activo: bool
    created_at: datetime

    model_config = {"from_attributes": True}


# ── Cliente ───────────────────────────────────────────────────────────────────

class ClienteBase(BaseModel):
    nombre: str
    telefono: Optional[str] = None
    direccion: Optional[str] = None
    latitud: Optional[float] = None
    longitud: Optional[float] = None
    notas: Optional[str] = None


class ClienteCreate(ClienteBase):
    vendedor_id: Optional[int] = None


class ClienteUpdate(BaseModel):
    nombre: Optional[str] = None
    telefono: Optional[str] = None
    direccion: Optional[str] = None
    latitud: Optional[float] = None
    longitud: Optional[float] = None
    notas: Optional[str] = None
    activo: Optional[bool] = None


class ClienteOut(ClienteBase):
    id: int
    vendedor_id: Optional[int] = None
    activo: bool
    created_at: datetime

    model_config = {"from_attributes": True}


# ── Producto ──────────────────────────────────────────────────────────────────

class ProductoBase(BaseModel):
    nombre: str
    descripcion: Optional[str] = None
    precio: float
    categoria: Optional[str] = None
    sku: Optional[str] = None
    stock: Optional[int] = 0
    imagen_url: Optional[str] = None


class ProductoCreate(ProductoBase):
    pass


class ProductoUpdate(BaseModel):
    nombre: Optional[str] = None
    descripcion: Optional[str] = None
    precio: Optional[float] = None
    categoria: Optional[str] = None
    sku: Optional[str] = None
    stock: Optional[int] = None
    activo: Optional[bool] = None
    imagen_url: Optional[str] = None


class ProductoOut(ProductoBase):
    id: int
    activo: bool
    created_at: datetime

    model_config = {"from_attributes": True}


# ── Pedido ────────────────────────────────────────────────────────────────────

class PedidoItem(BaseModel):
    producto_id: int
    nombre: str
    precio: float
    cantidad: int
    subtotal: float


class PedidoBase(BaseModel):
    cliente_id: int
    items: List[PedidoItem]
    total: float
    estado: Optional[str] = "pendiente"
    notas: Optional[str] = None


class PedidoCreate(PedidoBase):
    vendedor_id: Optional[int] = None
    synced: Optional[bool] = True


class PedidoUpdate(BaseModel):
    estado: Optional[str] = None
    notas: Optional[str] = None
    items: Optional[List[PedidoItem]] = None
    total: Optional[float] = None


class PedidoOut(PedidoBase):
    id: int
    vendedor_id: int
    synced: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


# ── Sync ──────────────────────────────────────────────────────────────────────

class SyncClienteItem(ClienteCreate):
    local_id: Optional[int] = None


class SyncPedidoItem(PedidoCreate):
    local_id: Optional[int] = None


class SyncRequest(BaseModel):
    clientes: Optional[List[SyncClienteItem]] = []
    pedidos: Optional[List[SyncPedidoItem]] = []


class SyncResponse(BaseModel):
    clientes_created: int
    pedidos_created: int
    errors: List[str] = []
