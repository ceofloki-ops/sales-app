from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, Text, ForeignKey
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base


class Vendedor(Base):
    __tablename__ = "vendedores"

    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(100), nullable=False)
    email = Column(String(100), unique=True, nullable=False, index=True)
    telefono = Column(String(20))
    hashed_password = Column(String(255), nullable=False)
    activo = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    clientes = relationship("Cliente", back_populates="vendedor")
    pedidos = relationship("Pedido", back_populates="vendedor")


class Cliente(Base):
    __tablename__ = "clientes"

    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(100), nullable=False)
    telefono = Column(String(20))
    direccion = Column(Text)
    latitud = Column(Float)
    longitud = Column(Float)
    vendedor_id = Column(Integer, ForeignKey("vendedores.id"), nullable=True)
    notas = Column(Text)
    activo = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    vendedor = relationship("Vendedor", back_populates="clientes")
    pedidos = relationship("Pedido", back_populates="cliente")


class Producto(Base):
    __tablename__ = "productos"

    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(200), nullable=False)
    descripcion = Column(Text)
    precio = Column(Float, nullable=False)
    categoria = Column(String(100))
    sku = Column(String(50), unique=True)
    stock = Column(Integer, default=0)
    activo = Column(Boolean, default=True)
    imagen_url = Column(String(500))
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class Pedido(Base):
    __tablename__ = "pedidos"

    id = Column(Integer, primary_key=True, index=True)
    cliente_id = Column(Integer, ForeignKey("clientes.id"), nullable=False)
    vendedor_id = Column(Integer, ForeignKey("vendedores.id"), nullable=False)
    items = Column(JSONB, nullable=False, default=list)
    total = Column(Float, nullable=False, default=0.0)
    estado = Column(String(50), default="pendiente")  # pendiente, confirmado, enviado, entregado, cancelado
    notas = Column(Text)
    synced = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    cliente = relationship("Cliente", back_populates="pedidos")
    vendedor = relationship("Vendedor", back_populates="pedidos")
