from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timedelta

import models
import schemas
import auth
from database import engine, get_db

models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Sales App API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Auth ──────────────────────────────────────────────────────────────────────

@app.post("/auth/login", response_model=schemas.Token)
def login(request: schemas.LoginRequest, db: Session = Depends(get_db)):
    vendedor = auth.authenticate_vendedor(db, request.email, request.password)
    if not vendedor:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciales incorrectas"
        )
    token = auth.create_access_token({"sub": str(vendedor.id)})
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": vendedor.id,
            "nombre": vendedor.nombre,
            "email": vendedor.email,
            "telefono": vendedor.telefono,
        }
    }


# ── Vendedores ────────────────────────────────────────────────────────────────

@app.get("/vendedores", response_model=List[schemas.VendedorOut])
def list_vendedores(
    db: Session = Depends(get_db),
    current_user: models.Vendedor = Depends(auth.get_current_user)
):
    return db.query(models.Vendedor).filter(models.Vendedor.activo == True).all()


@app.post("/vendedores", response_model=schemas.VendedorOut, status_code=201)
def create_vendedor(
    data: schemas.VendedorCreate,
    db: Session = Depends(get_db),
    current_user: models.Vendedor = Depends(auth.get_current_user)
):
    existing = db.query(models.Vendedor).filter(models.Vendedor.email == data.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email ya registrado")
    vendedor = models.Vendedor(
        nombre=data.nombre,
        email=data.email,
        telefono=data.telefono,
        hashed_password=auth.get_password_hash(data.password),
    )
    db.add(vendedor)
    db.commit()
    db.refresh(vendedor)
    return vendedor


@app.get("/vendedores/{vendedor_id}", response_model=schemas.VendedorOut)
def get_vendedor(
    vendedor_id: int,
    db: Session = Depends(get_db),
    current_user: models.Vendedor = Depends(auth.get_current_user)
):
    vendedor = db.query(models.Vendedor).filter(models.Vendedor.id == vendedor_id).first()
    if not vendedor:
        raise HTTPException(status_code=404, detail="Vendedor no encontrado")
    return vendedor


@app.put("/vendedores/{vendedor_id}", response_model=schemas.VendedorOut)
def update_vendedor(
    vendedor_id: int,
    data: schemas.VendedorUpdate,
    db: Session = Depends(get_db),
    current_user: models.Vendedor = Depends(auth.get_current_user)
):
    vendedor = db.query(models.Vendedor).filter(models.Vendedor.id == vendedor_id).first()
    if not vendedor:
        raise HTTPException(status_code=404, detail="Vendedor no encontrado")
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(vendedor, field, value)
    db.commit()
    db.refresh(vendedor)
    return vendedor


@app.delete("/vendedores/{vendedor_id}", status_code=204)
def delete_vendedor(
    vendedor_id: int,
    db: Session = Depends(get_db),
    current_user: models.Vendedor = Depends(auth.get_current_user)
):
    vendedor = db.query(models.Vendedor).filter(models.Vendedor.id == vendedor_id).first()
    if not vendedor:
        raise HTTPException(status_code=404, detail="Vendedor no encontrado")
    vendedor.activo = False
    db.commit()


# ── Clientes ──────────────────────────────────────────────────────────────────

@app.get("/clientes", response_model=List[schemas.ClienteOut])
def list_clientes(
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: models.Vendedor = Depends(auth.get_current_user)
):
    query = db.query(models.Cliente).filter(models.Cliente.activo == True)
    if search:
        query = query.filter(models.Cliente.nombre.ilike(f"%{search}%"))
    return query.order_by(models.Cliente.nombre).all()


@app.post("/clientes", response_model=schemas.ClienteOut, status_code=201)
def create_cliente(
    data: schemas.ClienteCreate,
    db: Session = Depends(get_db),
    current_user: models.Vendedor = Depends(auth.get_current_user)
):
    cliente = models.Cliente(
        **data.model_dump(),
        vendedor_id=data.vendedor_id or current_user.id
    )
    db.add(cliente)
    db.commit()
    db.refresh(cliente)
    return cliente


@app.get("/clientes/{cliente_id}", response_model=schemas.ClienteOut)
def get_cliente(
    cliente_id: int,
    db: Session = Depends(get_db),
    current_user: models.Vendedor = Depends(auth.get_current_user)
):
    cliente = db.query(models.Cliente).filter(models.Cliente.id == cliente_id).first()
    if not cliente:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")
    return cliente


@app.put("/clientes/{cliente_id}", response_model=schemas.ClienteOut)
def update_cliente(
    cliente_id: int,
    data: schemas.ClienteUpdate,
    db: Session = Depends(get_db),
    current_user: models.Vendedor = Depends(auth.get_current_user)
):
    cliente = db.query(models.Cliente).filter(models.Cliente.id == cliente_id).first()
    if not cliente:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(cliente, field, value)
    db.commit()
    db.refresh(cliente)
    return cliente


@app.delete("/clientes/{cliente_id}", status_code=204)
def delete_cliente(
    cliente_id: int,
    db: Session = Depends(get_db),
    current_user: models.Vendedor = Depends(auth.get_current_user)
):
    cliente = db.query(models.Cliente).filter(models.Cliente.id == cliente_id).first()
    if not cliente:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")
    cliente.activo = False
    db.commit()


# ── Productos ─────────────────────────────────────────────────────────────────

@app.get("/productos", response_model=List[schemas.ProductoOut])
def list_productos(
    categoria: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: models.Vendedor = Depends(auth.get_current_user)
):
    query = db.query(models.Producto).filter(models.Producto.activo == True)
    if categoria:
        query = query.filter(models.Producto.categoria == categoria)
    if search:
        query = query.filter(models.Producto.nombre.ilike(f"%{search}%"))
    return query.order_by(models.Producto.nombre).all()


@app.post("/productos", response_model=schemas.ProductoOut, status_code=201)
def create_producto(
    data: schemas.ProductoCreate,
    db: Session = Depends(get_db),
    current_user: models.Vendedor = Depends(auth.get_current_user)
):
    producto = models.Producto(**data.model_dump())
    db.add(producto)
    db.commit()
    db.refresh(producto)
    return producto


@app.get("/productos/{producto_id}", response_model=schemas.ProductoOut)
def get_producto(
    producto_id: int,
    db: Session = Depends(get_db),
    current_user: models.Vendedor = Depends(auth.get_current_user)
):
    producto = db.query(models.Producto).filter(models.Producto.id == producto_id).first()
    if not producto:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    return producto


@app.put("/productos/{producto_id}", response_model=schemas.ProductoOut)
def update_producto(
    producto_id: int,
    data: schemas.ProductoUpdate,
    db: Session = Depends(get_db),
    current_user: models.Vendedor = Depends(auth.get_current_user)
):
    producto = db.query(models.Producto).filter(models.Producto.id == producto_id).first()
    if not producto:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(producto, field, value)
    db.commit()
    db.refresh(producto)
    return producto


@app.delete("/productos/{producto_id}", status_code=204)
def delete_producto(
    producto_id: int,
    db: Session = Depends(get_db),
    current_user: models.Vendedor = Depends(auth.get_current_user)
):
    producto = db.query(models.Producto).filter(models.Producto.id == producto_id).first()
    if not producto:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    producto.activo = False
    db.commit()


# ── Pedidos ───────────────────────────────────────────────────────────────────

@app.get("/pedidos", response_model=List[schemas.PedidoOut])
def list_pedidos(
    estado: Optional[str] = None,
    vendedor_id: Optional[int] = None,
    today: Optional[bool] = None,
    db: Session = Depends(get_db),
    current_user: models.Vendedor = Depends(auth.get_current_user)
):
    query = db.query(models.Pedido)
    if estado:
        query = query.filter(models.Pedido.estado == estado)
    if vendedor_id:
        query = query.filter(models.Pedido.vendedor_id == vendedor_id)
    if today:
        start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
        query = query.filter(models.Pedido.created_at >= start)
    return query.order_by(models.Pedido.created_at.desc()).all()


@app.post("/pedidos", response_model=schemas.PedidoOut, status_code=201)
def create_pedido(
    data: schemas.PedidoCreate,
    db: Session = Depends(get_db),
    current_user: models.Vendedor = Depends(auth.get_current_user)
):
    items_dict = [item.model_dump() for item in data.items]
    pedido = models.Pedido(
        cliente_id=data.cliente_id,
        vendedor_id=data.vendedor_id or current_user.id,
        items=items_dict,
        total=data.total,
        estado=data.estado,
        notas=data.notas,
        synced=data.synced if data.synced is not None else True,
    )
    db.add(pedido)
    db.commit()
    db.refresh(pedido)
    return pedido


@app.get("/pedidos/{pedido_id}", response_model=schemas.PedidoOut)
def get_pedido(
    pedido_id: int,
    db: Session = Depends(get_db),
    current_user: models.Vendedor = Depends(auth.get_current_user)
):
    pedido = db.query(models.Pedido).filter(models.Pedido.id == pedido_id).first()
    if not pedido:
        raise HTTPException(status_code=404, detail="Pedido no encontrado")
    return pedido


@app.put("/pedidos/{pedido_id}", response_model=schemas.PedidoOut)
def update_pedido(
    pedido_id: int,
    data: schemas.PedidoUpdate,
    db: Session = Depends(get_db),
    current_user: models.Vendedor = Depends(auth.get_current_user)
):
    pedido = db.query(models.Pedido).filter(models.Pedido.id == pedido_id).first()
    if not pedido:
        raise HTTPException(status_code=404, detail="Pedido no encontrado")
    update_data = data.model_dump(exclude_unset=True)
    if "items" in update_data and update_data["items"]:
        update_data["items"] = [item.model_dump() if hasattr(item, 'model_dump') else item for item in data.items]
    for field, value in update_data.items():
        setattr(pedido, field, value)
    db.commit()
    db.refresh(pedido)
    return pedido


@app.delete("/pedidos/{pedido_id}", status_code=204)
def delete_pedido(
    pedido_id: int,
    db: Session = Depends(get_db),
    current_user: models.Vendedor = Depends(auth.get_current_user)
):
    pedido = db.query(models.Pedido).filter(models.Pedido.id == pedido_id).first()
    if not pedido:
        raise HTTPException(status_code=404, detail="Pedido no encontrado")
    db.delete(pedido)
    db.commit()


# ── Sync ──────────────────────────────────────────────────────────────────────

@app.post("/sync", response_model=schemas.SyncResponse)
def sync_data(
    data: schemas.SyncRequest,
    db: Session = Depends(get_db),
    current_user: models.Vendedor = Depends(auth.get_current_user)
):
    errors = []
    clientes_created = 0
    pedidos_created = 0

    for c in (data.clientes or []):
        try:
            cliente = models.Cliente(
                nombre=c.nombre,
                telefono=c.telefono,
                direccion=c.direccion,
                latitud=c.latitud,
                longitud=c.longitud,
                notas=c.notas,
                vendedor_id=c.vendedor_id or current_user.id,
            )
            db.add(cliente)
            db.flush()
            clientes_created += 1
        except Exception as e:
            errors.append(f"Cliente {c.nombre}: {str(e)}")

    for p in (data.pedidos or []):
        try:
            items_dict = [item.model_dump() if hasattr(item, 'model_dump') else item for item in p.items]
            pedido = models.Pedido(
                cliente_id=p.cliente_id,
                vendedor_id=p.vendedor_id or current_user.id,
                items=items_dict,
                total=p.total,
                estado=p.estado,
                notas=p.notas,
                synced=True,
            )
            db.add(pedido)
            db.flush()
            pedidos_created += 1
        except Exception as e:
            errors.append(f"Pedido cliente {p.cliente_id}: {str(e)}")

    db.commit()
    return schemas.SyncResponse(
        clientes_created=clientes_created,
        pedidos_created=pedidos_created,
        errors=errors,
    )


# ── Stats ─────────────────────────────────────────────────────────────────────

@app.get("/stats")
def get_stats(
    db: Session = Depends(get_db),
    current_user: models.Vendedor = Depends(auth.get_current_user)
):
    today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    pedidos_hoy = db.query(models.Pedido).filter(models.Pedido.created_at >= today_start).count()
    total_clientes = db.query(models.Cliente).filter(models.Cliente.activo == True).count()
    total_productos = db.query(models.Producto).filter(models.Producto.activo == True).count()
    total_pedidos = db.query(models.Pedido).count()
    ventas_hoy = db.query(models.Pedido).filter(
        models.Pedido.created_at >= today_start,
        models.Pedido.estado != "cancelado"
    ).all()
    total_ventas_hoy = sum(p.total for p in ventas_hoy)

    return {
        "pedidos_hoy": pedidos_hoy,
        "total_clientes": total_clientes,
        "total_productos": total_productos,
        "total_pedidos": total_pedidos,
        "ventas_hoy": total_ventas_hoy,
    }


@app.get("/health")
def health():
    return {"status": "ok"}
