import React from 'react';
import {
    AppBar, Toolbar, Typography, Box, Link, Button, IconButton, Drawer,
    List, ListItem, ListItemText, Divider, Grid, Card, CardContent
} from '../ui/material';
import { ArrowDropDown as ArrowDropDownIcon } from '../ui/icons';
import { Menu as MenuIcon } from '../ui/icons';
import { Link as RouterLink } from 'react-router-dom';
import heroBanner from '../assets/hero-banner.png';
import blockchainImg from '../assets/blockchain.png';
import web3Img from '../assets/web3.png';
import { QrCode as QrCodeIcon } from '../ui/icons';
import { RecentActors as RecentActorsIcon } from '../ui/icons';
import { ContactMail as ContactMailIcon } from '../ui/icons';
import { Twitter as TwitterIcon } from '../ui/icons';
import { Facebook as FacebookIcon } from '../ui/icons';
import { LinkedIn as LinkedInIcon } from '../ui/icons';

const pairs = [
    { label: 'Bitcoin (BTC)', value: 'bitcoin', logo: 'https://cryptologos.cc/logos/bitcoin-btc-logo.png' },
    { label: 'Ethereum (ETH)', value: 'ethereum', logo: 'https://cryptologos.cc/logos/ethereum-eth-logo.png' },
    { label: 'Polygon (MATIC)', value: 'matic-network', logo: 'https://cryptologos.cc/logos/polygon-matic-logo.png' },
    { label: 'Binance (BNB)', value: 'binancecoin', logo: 'https://cryptologos.cc/logos/bnb-bnb-logo.png' },
    { label: 'Fantom (FTM)', value: 'fantom', logo: 'https://cryptologos.cc/logos/fantom-ftm-logo.png' },
    { label: 'Avalanche (AVAX)', value: 'avalanche-2', logo: 'https://cryptologos.cc/logos/avalanche-avax-logo.png' },
    { label: 'Optimism (OP)', value: 'BINANCE:OPUSDT', logo: 'https://cryptologos.cc/logos/optimism-ethereum-op-logo.png' },
];

const navItems = [
    { to: '/create', icon: <QrCodeIcon />, text: 'Proveedor P2P' },
    { to: '/providers', icon: <QrCodeIcon />, text: 'Vender P2P' },
    { to: '/servicios', icon: <RecentActorsIcon />, text: 'Servicios' },
    { to: '/contactanos', icon: <ContactMailIcon />, text: 'Contáctanos' }
];

const Nextmain = () => {
    const [mobileOpen, setMobileOpen] = React.useState(false);

    const handleDrawerToggle = () => {
        setMobileOpen(!mobileOpen);
    };

    const drawer = (
        <Box onClick={handleDrawerToggle} sx={{ textAlign: 'center' }}>
            <List>
                {navItems.map((item, index) => (
                    <ListItem key={index}>
                        <ListItemText>
                            <Link
                                component={RouterLink}
                                to={item.to}
                                sx={{
                                    textDecoration: 'none',
                                    color: 'text.primary',
                                    fontWeight: 'bold',
                                    fontSize: '0.75rem',
                                }}
                            >
                                {item.icon && <span style={{ verticalAlign: 'middle', marginRight: '0.5rem' }}>{item.icon}</span>}
                                {item.text}
                            </Link>
                        </ListItemText>
                    </ListItem>
                ))}
                <ListItem>
                    <ListItemText>
                        <Button
                            component={RouterLink}
                            to="/login"
                            variant="outlined"
                            color="inherit"
                            sx={{
                                width: 'auto',
                                mb: 1,
                                borderColor: 'text.primary',
                                fontSize: '0.75rem',
                                borderRadius: '20px',
                                padding: '6px 16px',
                                '&:hover': {
                                    borderColor: '#FFD700',
                                    color: '#FFD700',
                                },
                            }}
                        >
                            Iniciar sesión
                        </Button>
                        <Button
                            component={RouterLink}
                            to="/register"
                            variant="contained"
                            color="primary"
                            sx={{
                                width: 'auto',
                                fontSize: '0.75rem',
                                borderRadius: '20px',
                                padding: '6px 16px',
                                '&:hover': {
                                    backgroundColor: '#0056b3',
                                },
                            }}
                        >
                            Registrarse
                        </Button>
                    </ListItemText>
                </ListItem>
            </List>
        </Box>
    );
    return (
        <div>
            <AppBar position="fixed" sx={{ width: '100%', top: 0, bgcolor: '#1976d2' }}>
                <Toolbar sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    
                    <IconButton
                        color="inherit"
                        aria-label="open drawer"
                        edge="start"
                        onClick={handleDrawerToggle}
                        sx={{ display: { xs: 'block', sm: 'none' } }}
                    >
                        <MenuIcon />
                    </IconButton>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', color: 'white' }}>
                            BlockVault
                        </Typography>
                        <Box
                            sx={{
                                m: 1,
                                width: 45,
                                height: 50,
                                clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)',
                                bgcolor: '#2186EB',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                ml: 1,
                            }}
                        >
                            <ArrowDropDownIcon sx={{ color: 'white', fontSize: 50 }} />
                        </Box>
                    </Box>
    
                    <Box sx={{ display: { xs: 'none', sm: 'flex' }, alignItems: 'center' }}>
    {[
        { to: '/create', label: 'Proveedor P2P', icon: <QrCodeIcon /> },
        { to: '/providers', label: 'Vender P2P', icon: <QrCodeIcon /> },
        { to: '/servicios', label: 'Servicios', icon: <RecentActorsIcon /> },
        { to: '/contactanos', label: 'Contáctanos', icon: <ContactMailIcon /> },
    ].map((item, index) => (
        <Link
            key={index}
            component={RouterLink}
            to={item.to}
            sx={{
                color: 'white',
                textDecoration: 'none',
                marginLeft: 4,
                fontWeight: 'bold',
                fontSize: '0.9rem',
                display: 'flex',
                alignItems: 'center',
                '&:hover': {
                    textDecoration: 'underline',
                    color: '#FFD700',
                },
            }}
        >
            <span style={{ marginRight: '0.5rem' }}>{item.icon}</span>
            {item.label}
        </Link>
    ))}
</Box>


                    <Box sx={{ display: { xs: 'none', sm: 'flex' }, alignItems: 'center' }}>
                        <Button
                            component={RouterLink}
                            to="/login"
                            variant="outlined"
                            color="inherit"
                            sx={{
                                marginLeft: 2,
                                fontWeight: 'bold',
                                color: 'white',
                                borderColor: 'white',
                                '&:hover': {
                                    borderColor: '#FFD700',
                                    color: '#FFD700',
                                },
                            }}
                        >
                            Iniciar sesión
                        </Button>
                        <Button
                            component={RouterLink}
                            to="/register"
                            variant="contained"
                            color="primary"
                            sx={{
                                marginLeft: 2,
                                fontWeight: 'bold',
                                '&:hover': {
                                    bgcolor: '#004ba0',
                                },
                            }}
                        >
                            Registrarse
                        </Button>
                    </Box>
                </Toolbar>
            </AppBar>

            
            <Drawer
                variant="temporary"
                anchor="left"
                open={mobileOpen}
                onClose={handleDrawerToggle}
                sx={{
                    display: { xs: 'block', sm: 'none' },
                    '& .MuiDrawer-paper': {
                        width: 240,
                        boxSizing: 'border-box',
                    },
                }}
            >
                {drawer}
            </Drawer>

            <main style={{ marginTop: '64px', padding: '16px' }}>
    <Box
        sx={{
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            alignItems: 'center',
            justifyContent: 'center',
            gap: 2, 
            mb: 4,
        }}
    >
        <Box sx={{ textAlign: 'center', mb: { xs: 4, md: 0 } }}> 
            <Typography variant="h5" sx={{ flexShrink: 0, mb: 1 }}> 
                Welcome to NextCryptoATM
            </Typography>
            <Typography variant="subtitle1" sx={{ color: 'text.secondary', mb: 1 }}> 
                Your gateway to the future of crypto transactions.
            </Typography>
            <Button
                component={RouterLink}
                to="/"
                variant="contained"
                color="primary"
                sx={{ fontWeight: 'bold' }}
            >
                Get Started
            </Button>
        </Box>
        <img
            src={heroBanner}
            alt="Hero Banner"
            style={{
                maxWidth: '80%', 
                height: 'auto',
                borderRadius: '8px',
                flexShrink: 0,
            }}
        />
    </Box>




    {/* SECCION 2 */}

    <Divider sx={{ my: 10, bgcolor: '#ddd', height: 2 }} />
<Box
    sx={{
        padding: 4,
        background: 'linear-gradient(135deg, #f0f4f8 0%, #e0e5e8 100%)',
        borderRadius: 4,
        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1)',
        position: 'relative',
        overflow: 'hidden'
    }}
>


<Box
    sx={{
        padding: 4,
        backgroundColor: '#ffffff',
        borderRadius: 8,
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.1)',
        color: '#333',
        textAlign: 'center',
    }}
>
    <Typography
        variant="h4"
        sx={{
            mb: 2,
            color: '#007BFF',
            fontWeight: 'bold',
            letterSpacing: '1px',
            fontFamily: 'Roboto, sans-serif',
        }}
    >
        Vende tus Tokens y Obtén un Depósito Directo
    </Typography>

    <Typography
        variant="h6"
        sx={{
            mb: 4,
            color: '#555',
            fontWeight: 'normal',
            fontFamily: 'Roboto, sans-serif',
            fontStyle: 'italic',
        }}
    >
        Puenteando la Brecha en Finanzas Digitales
    </Typography>

    <Typography
        variant="body1"
        sx={{
            mb: 3,
            color: '#444',
            fontFamily: 'Roboto, sans-serif',
            lineHeight: 1.6,
            maxWidth: '800px',
            mx: 'auto',
        }}
    >
        En NextCryptoATM, utilizamos tecnología blockchain de vanguardia para facilitar transacciones seguras y sin problemas en diversas redes, incluyendo Ethereum, Bitcoin y Avalanche. Nuestra plataforma te permite vender tus criptomonedas de forma sencilla y obtener un depósito directo en tu cuenta.
    </Typography>

    <Typography
        variant="body1"
        sx={{
            mb: 3,
            color: '#444',
            fontFamily: 'Roboto, sans-serif',
            lineHeight: 1.6,
            maxWidth: '800px',
            mx: 'auto',
        }}
    >
        Vender criptomonedas a fiat nunca ha sido tan fácil. A través de nuestro sistema de intercambio P2P, puedes realizar transacciones directamente con otros usuarios, garantizando seguridad y transparencia. Nuestro servicio de custodia asegura que tus activos estén protegidos durante todo el proceso.
    </Typography>

    <Typography
        variant="body1"
        sx={{
            mb: 4,
            color: '#444',
            fontFamily: 'Roboto, sans-serif',
            lineHeight: 1.6,
            maxWidth: '800px',
            mx: 'auto',
        }}
    >
        Únete a nosotros y revoluciona la manera en que interactúas con los activos digitales, haciendo que las finanzas sean accesibles, seguras y eficientes.
    </Typography>

    <Divider sx={{ my: 4, bgcolor: '#007BFF', height: 2 }} />

    <Box
        sx={{
            display: 'flex',
            overflowX: 'auto',
            scrollBehavior: 'smooth',
            justifyContent: 'center',
            width: '100%',
            '&::-webkit-scrollbar': { display: 'none' },
        }}
    >
        <Box
            className="logos-container"
            sx={{
                display: 'flex',
                transition: 'transform 0.5s ease-in-out',
                width: 'max-content',
            }}
        >
            {pairs.map((pair) => (
                <Box
                    key={pair.value}
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        p: 2,
                        borderRadius: '12px',
                        background: 'rgba(0, 123, 255, 0.1)',
                        boxShadow: '0 0 20px rgba(0, 123, 255, 0.2)',
                        transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                        '&:hover': {
                            transform: 'scale(1.1)',
                            boxShadow: '0 0 30px rgba(0, 123, 255, 0.5)',
                        },
                        mx: 1,
                    }}
                >
                    <img
                        src={pair.logo}
                        alt={pair.label}
                        style={{
                            maxWidth: '60px',
                            height: 'auto',
                            objectFit: 'contain',
                        }}
                    />
                </Box>
            ))}
        </Box>
    </Box>
</Box>
</Box>



{/* SECCION 3 */}

<Divider sx={{ my: 10, bgcolor: '#ddd', height: 2 }} />
            <Box
                sx={{
                    padding: 4,
                    backgroundColor: '#ffffff',
                    borderRadius: 12,
                    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.1)',
                    transition: 'transform 0.3s ease',
                    '&:hover': {
                        transform: 'scale(1.02)',
                    },
                }}
            >
                <Typography
                    variant="h4"
                    sx={{
                        textAlign: 'center',
                        mb: 4,
                        color: '#333',
                        fontWeight: '700',
                        letterSpacing: '1px',
                    }}
                >
                    Nuestra Tecnología
                </Typography>
                
                <Grid container spacing={4} alignItems="center" sx={{ mb: 8 }}>
                    <Grid item xs={12} md={6}>
                        <Box
                            sx={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                position: 'relative',
                            }}
                        >
                            <img
                                src={web3Img}
                                alt="Web 3.0"
                                style={{
                                    maxWidth: '90%',
                                    height: 'auto',
                                    borderRadius: '16px',
                                    boxShadow: '0 6px 30px rgba(33, 150, 243, 0.3)',
                                    transition: 'transform 0.3s ease',
                                    position: 'relative',
                                    zIndex: 1,
                                }}
                            />
                            <Box
                                sx={{
                                    position: 'absolute',
                                    top: '0',
                                    left: '0',
                                    width: '100%',
                                    height: '100%',
                                    borderRadius: '16px',
                                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                    backdropFilter: 'blur(12px)',
                                    zIndex: 0,
                                    transition: 'transform 0.3s ease',
                                    '&:hover': {
                                        transform: 'scale(1.05)',
                                    },
                                }}
                            />
                        </Box>
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <Typography
                            variant="h5"
                            sx={{
                                mb: 2,
                                color: '#2196F3',
                                fontWeight: 'bold',
                            }}
                        >
                            Sistema de Pagos Descentralizado
                        </Typography>
                        <Typography
                            variant="body1"
                            sx={{
                                color: '#444',
                                lineHeight: 1.6,
                            }}
                        >
                            Nuestra tecnología se basa en blockchain para ofrecer un sistema de pagos descentralizado que garantiza transparencia, seguridad y eficiencia. Utilizamos contratos inteligentes y la infraestructura de Web 3.0 para permitir transacciones directas entre usuarios sin intermediarios, reduciendo costos y aumentando la velocidad de las transacciones.
                        </Typography>
                    </Grid>
                </Grid>
                
                <Divider sx={{ my: 4, bgcolor: '#333', height: 2 }} />
                
                <Grid container spacing={4} alignItems="center" sx={{ mb: 8 }}>
                    <Grid item xs={12} md={6}>
                        <Typography
                            variant="h5"
                            sx={{
                                mb: 2,
                                color: '#2196F3',
                                fontWeight: 'bold',
                            }}
                        >
                            Cómo Funciona una Wallet Crypto Basada en RPC
                        </Typography>
                        <Typography
                            variant="body1"
                            sx={{
                                color: '#444',
                                lineHeight: 1.6,
                            }}
                        >
                            Una wallet crypto basada en RPC (Remote Procedure Call) permite interactuar con la blockchain de manera segura. Al usar RPC, la wallet se comunica con un nodo de la blockchain para realizar operaciones como consultar el saldo, enviar transacciones o recibir notificaciones de eventos. Este enfoque ofrece una capa adicional de seguridad y descentralización, asegurando que las transacciones se realicen de manera eficiente y confiable.
                        </Typography>
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <Box
                            sx={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                position: 'relative',
                            }}
                        >
                            <img
                                src={require('../assets/wallet.png')}
                                alt="Wallet Crypto RPC"
                                style={{
                                    maxWidth: '90%',
                                    height: 'auto',
                                    borderRadius: '16px',
                                    boxShadow: '0 6px 30px rgba(33, 150, 243, 0.3)',
                                    transition: 'transform 0.3s ease',
                                    position: 'relative',
                                    zIndex: 1,
                                }}
                            />
                            <Box
                                sx={{
                                    position: 'absolute',
                                    top: '0',
                                    left: '0',
                                    width: '100%',
                                    height: '100%',
                                    borderRadius: '16px',
                                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                    backdropFilter: 'blur(12px)',
                                    zIndex: 0,
                                    transition: 'transform 0.3s ease',
                                    '&:hover': {
                                        transform: 'scale(1.05)',
                                    },
                                }}
                            />
                        </Box>
                    </Grid>
                </Grid>


              {/* SECCION 4 */}
                
<Divider sx={{ my: 4, bgcolor: '#333', height: 2 }} />
    <Grid container spacing={4} alignItems="center">
        <Grid item xs={12} md={6}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <img
                    src={blockchainImg}
                    alt="Blockchain Technology"
                    style={{ maxWidth: '100%', height: 'auto', borderRadius: '12px', boxShadow: '0 6px 12px rgba(0, 255, 200, 0.3)', transition: 'transform 0.3s ease', '&:hover': { transform: 'scale(1.05)' } }}
                />
            </Box>
        </Grid>
        <Grid item xs={12} md={6}>
            <Typography variant="h5" sx={{ mb: 2, color: '#2196F3', fontWeight: 'bold', fontFamily: 'Roboto, sans-serif' }}>
                Por qué usar Blockchain
            </Typography>
            <Typography variant="body1" sx={{ color: '#000', fontFamily: 'Roboto, sans-serif' }}>
                La tecnología blockchain asegura que todas las transacciones sean inmutables y accesibles públicamente, ofreciendo un registro confiable y auditable de todas las actividades. Esto no solo proporciona una capa adicional de seguridad, sino que también fomenta una mayor confianza entre los participantes del sistema.
            </Typography>
        </Grid>
    </Grid>
</Box>



{/* SECCION 5 */}

<Divider sx={{ my: 10, bgcolor: '#ddd', height: 2 }} />
<Box
    sx={{
        textAlign: 'center',
        background: 'linear-gradient(180deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.15) 100%)',
        padding: 4,
        borderRadius: 8,
        boxShadow: '0 6px 12px rgba(0, 0, 0, 0.15)',
    }}
>
    <Typography variant="h4" sx={{ mb: 4, color: '#007BFF', fontWeight: 'bold' }}>
        Cómo Funciona NextCryptoATM
    </Typography>

    <Typography variant="h6" sx={{ mb: 4, color: '#555', fontWeight: 'normal', fontStyle: 'italic' }}>
        Facilitando el Intercambio de Criptomonedas
    </Typography>

    <Box
        sx={{
            display: 'flex',
            justifyContent: 'center',
            flexWrap: 'wrap',
            gap: 4,
        }}
    >
        {[
            {
                title: 'Quiénes Somos',
                content: 'En NextCryptoATM, somos un equipo dinámico dedicado a transformar los pagos electrónicos mediante soluciones innovadoras en criptomonedas. Nuestra experiencia en tecnología blockchain nos permite ofrecer sistemas de pago seguros, eficientes y de vanguardia.',
                details: 'Combinamos habilidades financieras y tecnológicas para estar a la vanguardia de los avances en la industria.'
            },
            {
                title: 'Nuestra Misión',
                content: 'Crear un ecosistema financiero donde las transacciones de criptomonedas sean fluidas y accesibles. Buscamos eliminar las barreras de entrada y empoderar a los usuarios con herramientas avanzadas para la adopción global de las monedas digitales.',
                details: 'Desarrollamos plataformas intuitivas que hacen que las transacciones en criptomonedas sean confiables para todos.'
            },
            {
                title: 'Nuestra Visión',
                content: 'Un futuro donde las criptomonedas sean parte integral de las transacciones diarias, impulsando la inclusión financiera y la innovación. Nos esforzamos por hacer que las monedas digitales sean comunes en la vida cotidiana.',
                details: 'Nos enfocamos en crear soluciones prácticas que faciliten el uso generalizado de las monedas digitales.'
            },
            {
                title: 'Nuestra Pasión',
                content: 'Apasionados por la tecnología y el blockchain, estamos comprometidos a revolucionar los pagos con soluciones avanzadas. Nuestra búsqueda de progreso asegura productos y servicios excepcionales.',
                details: 'Exploramos nuevas ideas y tecnologías para mejorar nuestras ofertas y mantener el liderazgo en la industria.'
            }
        ].map((card, index) => (
            <Card
                key={index}
                sx={{
                    maxWidth: 345,
                    textAlign: 'center',
                    borderRadius: 4,
                    boxShadow: '0 6px 16px rgba(0, 0, 0, 0.1)',
                    bgcolor: '#ffffff',
                    transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                    '&:hover': {
                        transform: 'scale(1.05)',
                        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.2)',
                    },
                }}
            >
                <CardContent>
                    <Typography variant="h6" sx={{ mb: 2, color: '#007BFF', fontWeight: 'bold' }}>
                        {card.title}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#444', mb: 2 }}>
                        {card.content}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#666' }}>
                        {card.details}
                    </Typography>
                </CardContent>
            </Card>
        ))}
    </Box>
</Box>



{/* SECCION 6 */}


<Divider sx={{ my: 10, bgcolor: '#ddd', height: 2 }} />
<Box
    sx={{
        padding: 4,
        backgroundColor: '#ffffff',
        borderRadius: 8,
        boxShadow: '0 6px 12px rgba(0, 0, 0, 0.2)',
    }}
>
    <Typography
        variant="h4"
        sx={{
            textAlign: 'center',
            mb: 2,
            color: '#333',
            fontWeight: '600',
            letterSpacing: '1.5px',
        }}
    >
        Trading View en NextCryptoATM
    </Typography>

    <Typography
        variant="body1"
        sx={{
            textAlign: 'center',
            mb: 4,
            color: '#555',
            fontSize: '1.1rem',
            lineHeight: 1.6,
        }}
    >
        En nuestra plataforma, utilizamos TradingView para ofrecerte análisis de tendencias del mercado de criptomonedas. Con gráficos interactivos y herramientas de análisis, puedes tomar decisiones informadas sobre tus inversiones.
    </Typography>

    <Typography
        variant="body1"
        sx={{
            textAlign: 'center',
            mb: 4,
            color: '#555',
            fontSize: '1.1rem',
            lineHeight: 1.6,
        }}
    >
        Para utilizar TradingView en NextCryptoATM, simplemente selecciona la criptomoneda que deseas analizar, y verás el gráfico correspondiente. Puedes personalizar los indicadores y el intervalo de tiempo para ajustar tu análisis a tus necesidades.
    </Typography>

    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', mb: 4 }}>
        <iframe
            src="https://www.tradingview.com/widgetembed/?frameElementId=tradingview_12345&symbol=ETHUSD&interval=D&studies=[]&theme=Light&style=1"
            width="80%"
            height="400"
            frameBorder="0"
            scrolling="no"
            allow="encrypted-media"
            title="Trading View"
            style={{
                borderRadius: '12px',
                boxShadow: '0 6px 12px rgba(0, 0, 0, 0.2)',
            }}
        ></iframe>
    </Box>

    <Typography
        variant="body2"
        sx={{
            textAlign: 'center',
            color: '#777',
            mb: 2,
            fontSize: '0.95rem',
            lineHeight: 1.5,
        }}
    >
        * Recuerda que este análisis es solo informativo. Evalúa todos los factores antes de invertir.
    </Typography>

    <Typography
        variant="body2"
        sx={{
            textAlign: 'center',
            color: '#007BFF',
            fontSize: '0.95rem',
            lineHeight: 1.5,
        }}
    >
        Para más información y herramientas, visita nuestra sección de <a href="/resources" style={{ color: '#007BFF', textDecoration: 'underline' }}>recursos</a>.
    </Typography>
</Box>


{/* SECCION 7*/}

<Divider sx={{ my: 10, bgcolor: '#ddd', height: 2 }} />
            <Box
                sx={{
                    padding: 4,
                    backgroundColor: '#ffffff', 
                    borderRadius: 4,
                    boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
                    textAlign: 'center',
                }}
            >
                <Typography
                    variant="h5"
                    sx={{
                        mb: 2,
                        color: '#333',
                        fontWeight: 'bold',
                        letterSpacing: '1px',
                    }}
                >
                    ¡Gracias por visitar!
                </Typography>

                <Typography variant="body2" sx={{ mb: 4, color: '#666' }}>
                    Mantente al tanto de nuestras actualizaciones y noticias sobre el mercado.
                </Typography>

                <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mb: 4 }}>
                    <IconButton
                        component="a"
                        href="https://www.twitter.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label="Twitter"
                        sx={{ color: '#1DA1F2', '&:hover': { transform: 'scale(1.1)' } }}
                    >
                        <TwitterIcon />
                    </IconButton>
                    <IconButton
                        component="a"
                        href="https://www.facebook.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label="Facebook"
                        sx={{ color: '#1877F2', '&:hover': { transform: 'scale(1.1)' } }}
                    >
                        <FacebookIcon />
                    </IconButton>
                    <IconButton
                        component="a"
                        href="https://www.linkedin.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label="LinkedIn"
                        sx={{ color: '#0A66C2', '&:hover': { transform: 'scale(1.1)' } }}
                    >
                        <LinkedInIcon />
                    </IconButton>
                </Box>

                <Grid container spacing={4} justifyContent="center" sx={{ mb: 4 }}>
                    {[
                        'Contacto',
                        'Desarrolladores',
                        'Soporte',
                        'Política de Privacidad',
                        'Blog',
                        'Términos de Servicio',
                        'FAQs',
                        'Carreras',
                    ].map((item) => (
                        <Grid item key={item}>
                            <Typography
                                variant="body2"
                                sx={{
                                    cursor: 'pointer',
                                    color: '#007BFF',
                                    '&:hover': {
                                        textDecoration: 'underline',
                                    },
                                }}
                            >
                                {item}
                            </Typography>
                        </Grid>
                    ))}
                </Grid>

                <Typography variant="body2" sx={{ mt: 3, color: '#999' }}>
                    © {new Date().getFullYear()} Tu Empresa. Todos los derechos reservados.
                </Typography>
            </Box>
</main>
</div>
);
};

export default Nextmain;
