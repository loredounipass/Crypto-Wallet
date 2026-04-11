import * as React from 'react';
import Title from './utils/Title';
import {
    Typography,
    Link,
    TableRow,
    TableHead,
    TableCell,
    TableBody,
    Table,
    Paper,
    Box,
    Alert,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Grid,
    Zoom,
    IconButton,
    Tooltip,
    TableContainer,
    useTheme,
    Avatar,
} from '@mui/material';
import { getDisplayableTxHash, getStatusName } from './utils/Display';
import {
    getCoinDecimalsPlace,
    getCoinFee,
    getCoinLogo,
    getNetworkExplorerBase,
    getNetworkName
} from './utils/Chains';
import CopyToClipboard from 'react-copy-to-clipboard';
import CopyIcon from "../assets/receiveCopyIcon.svg";
import LinkIcon from "../assets/linkIcon.svg";
import getTransaction from '../hooks/getTransaction';

export default function CoinTransactions({ transactions, coin, chainId }) {
    var interval;
    const [copied, setCopied] = React.useState(false);
    const [txCopied, setTxCopied] = React.useState(false);
    const [openDialog, setOpenDialog] = React.useState(false);
    const [selectedTransaction, setSelectedTransaction] = React.useState(undefined);

    const theme = useTheme();

    const handleClose = () => {
        if (interval) {
            clearInterval(interval);
        }
        setOpenDialog(false);
        setSelectedTransaction(undefined);
    };

    const monitorTransaction = (transaction) => {
        if (interval) {
            clearInterval(interval);
        }

        interval = setInterval(async function () {
            const _transaction = await getTransaction(transaction.transactionId);
            setSelectedTransaction(_transaction);
            if (_transaction.status === 3)
                clearInterval(interval);
        }, 5000);
    };

    const handleOpen = async (transaction, e) => {
        if (e) e.preventDefault();
        setSelectedTransaction(transaction);
        setOpenDialog(true);
        monitorTransaction(transaction);
    };

    const getRealDate = (date) => {
        return date?.replace('T', ' ').replace('Z', '').replace(/\.\d+/, "");
    };

    return (
        <>
            <Paper
                sx={{
                    p: 2,
                    overflowX: 'auto',
                    backgroundColor: theme.palette.background.paper,
                    borderRadius: 2,
                    boxShadow: 3,
                }}
            >
                <Title>Historial de transacciones</Title>
                <TableContainer sx={{ maxHeight: 210 }}>
                    <Table size="small">
                        <TableHead>
                            <TableRow>
                                <TableCell>IDTransacción</TableCell>
                                <TableCell>Cantidad</TableCell>
                                <TableCell>Estado</TableCell>
                                <TableCell>Fecha</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {transactions.map((transaction) => (
                                <TableRow style={{ cursor: 'pointer' }} key={transaction.txHash} onClick={() => handleOpen(transaction)}>
                                    <TableCell>
                                        <Link onClick={(e) => handleOpen(transaction, e)} underline='none' target='_blank'>
                                            {getDisplayableTxHash(transaction.txHash)}
                                        </Link>
                                    </TableCell>
                                    <TableCell>
                                        <Typography
                                            component="span"
                                            color={transaction.nature === 1 ? 'green' : 'red'}>
                                            {transaction.nature === 1 && transaction.status > 1 ? '+' : ''}
                                            {transaction.amount ? parseFloat(transaction.amount).toFixed(getCoinDecimalsPlace(coin)) : ''}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        {
                                            transaction.status === 1 ?
                                                <Alert severity="warning" icon={false}>  {getStatusName(transaction.status)}</Alert> :
                                                transaction.status === 2 ?
                                                    <Alert severity="info" icon={false}>
                                                        {transaction.confirmations > 0 ? `Confirmación ${transaction.confirmations}/12` : getStatusName(transaction.status)}
                                                    </Alert> :
                                                    transaction.status === 3 ?
                                                        <Alert severity="success" icon={false}>  {getStatusName(transaction.status)}</Alert> :
                                                        transaction.status === 4 ?
                                                            <Alert severity="error" icon={false}>  {getStatusName(transaction.status)}</Alert> :
                                                            getStatusName(transaction.status)
                                        }
                                    </TableCell>
                                    <TableCell>{getRealDate(transaction.created_at)}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
                <Box margin={3}></Box>
            </Paper>
            <Dialog
                fullWidth
                maxWidth="sm"
                open={openDialog}
                onClose={handleClose}
                aria-labelledby="alert-dialog-title"
                aria-describedby="alert-dialog-description"
                PaperProps={{
                    sx: {
                        borderRadius: 2,
                        boxShadow: 3,
                        backgroundColor: theme.palette.background.paper,
                    }
                }}
            >
                <DialogTitle id="alert-dialog-title">
                    {`Detalles de ${selectedTransaction
                        ? selectedTransaction.nature === 1 ? 'Depósito' : 'Retiro' : 'Transacción'}`}
                </DialogTitle>
                <DialogContent>
                    {
                        selectedTransaction ? (
                            <Box>
                                <Box mb={2}>
                                    <Grid container spacing={2}>
                                        <Grid item xs={12} sm={6}>
                                            <Typography variant="body2" color="text.secondary" mb={1}>
                                                Estado
                                            </Typography>
                                            <Typography variant="body2" color={
                                                selectedTransaction.status === 1 ? '#ffc107'
                                                    : selectedTransaction.status === 2 ? '#17a2b8'
                                                        : selectedTransaction.status === 3 ? 'rgb(14, 203, 129)'
                                                            : selectedTransaction.status === 4 ? '#dc3545' : 'black'
                                            }>
                                                <span style={{ fontSize: '1.2rem' }}>●</span>
                                                {selectedTransaction.status === 2 ? selectedTransaction.confirmations > 0 ? `Confirmación ${selectedTransaction.confirmations}/12` : getStatusName(selectedTransaction.status)
                                                    : getStatusName(selectedTransaction.status)}
                                            </Typography>
                                        </Grid>
                                        <Grid item xs={12} sm={6}>
                                            <Typography variant="body2" color="text.secondary" mb={1}>
                                                Fecha
                                            </Typography>
                                            <Typography variant="body2" color='black'>
                                                {getRealDate(selectedTransaction.created_at)}
                                            </Typography>
                                        </Grid>
                                    </Grid>
                                </Box>
                                <Box mb={2}>
                                    <Grid container spacing={2}>
                                        <Grid item xs={12} sm={6}>
                                            <Typography variant="body2" color="text.secondary" mb={1}>
                                                Moneda
                                            </Typography>
                                            <Grid container alignItems="center">
                                                <Grid item>
                                                    <Avatar src={getCoinLogo(coin)} alt={`${coin.toUpperCase()} logo`} sx={{ width: 24, height: 24 }} />
                                                </Grid>
                                                <Grid item>
                                                    <Typography variant="body2" color='black' style={{ marginLeft: 8 }}>
                                                        {coin.toUpperCase()}
                                                    </Typography>
                                                </Grid>
                                            </Grid>
                                        </Grid>
                                        <Grid item xs={12} sm={6}>
                                            <Typography variant="body2" color="text.secondary" mb={1}>
                                                Cantidad
                                            </Typography>
                                            <Typography variant="body2" color='black'>
                                                {selectedTransaction.nature === 1 ? parseFloat(selectedTransaction.amount).toFixed(getCoinDecimalsPlace(coin))
                                                    : -1 * parseFloat(Math.abs(selectedTransaction.amount) - getCoinFee(coin)).toFixed(getCoinDecimalsPlace(coin))}
                                            </Typography>
                                        </Grid>
                                    </Grid>
                                </Box>
                                <Box mb={2}>
                                    <Grid container spacing={2}>
                                        <Grid item xs={12} sm={6}>
                                            <Typography variant="body2" color="text.secondary" mb={1}>
                                                Red
                                            </Typography>
                                            <Typography variant="body2" color='black'>
                                                {getNetworkName(chainId)}
                                            </Typography>
                                        </Grid>
                                    </Grid>
                                </Box>
                                {selectedTransaction.nature === 2 && (
                                    <>
                                        <Box mb={2}>
                                            <Grid container spacing={2}>
                                                <Grid item xs={12} sm={6}>
                                                    <Typography variant="body2" color="text.secondary" mb={1}>
                                                        Comisión de la red
                                                    </Typography>
                                                    <Typography variant="body2" color='black'>
                                                        {getCoinFee(coin)}
                                                    </Typography>
                                                </Grid>
                                            </Grid>
                                        </Box>
                                        <Box mb={2}>
                                            <Grid container spacing={2}>
                                                <Grid item xs={12} sm={6}>
                                                    <Typography variant="body2" color="text.secondary" mb={1}>
                                                        Dirección to
                                                    </Typography>
                                                    <Typography variant="body2" color='black'>
                                                        {selectedTransaction.to}
                                                        <Link color='inherit' underline='none' target='_blank' href={`${getNetworkExplorerBase(chainId).replace('tx', 'address')}${selectedTransaction.to}`}>
                                                            <IconButton>
                                                                <img src={LinkIcon} alt="abrir" style={{ width: "100%", height: "100%" }} />
                                                            </IconButton>
                                                        </Link>
                                                        <CopyToClipboard
                                                            text={selectedTransaction.to}
                                                            onCopy={() => setCopied(true)}
                                                        >
                                                            <Tooltip
                                                                title={
                                                                    copied ? (
                                                                        <Typography variant="caption" color="text.success">
                                                                            Dirección copiada!
                                                                        </Typography>
                                                                    ) : (
                                                                        "Copiar"
                                                                    )
                                                                }
                                                                TransitionComponent={Zoom}
                                                            >
                                                                <IconButton>
                                                                    <img src={CopyIcon} alt="copiar" style={{ width: "100%", height: "100%" }} />
                                                                </IconButton>
                                                            </Tooltip>
                                                        </CopyToClipboard>
                                                    </Typography>
                                                </Grid>
                                            </Grid>
                                        </Box>
                                    </>
                                )}
                                {selectedTransaction.status > 1 && (
                                    <Box mb={2}>
                                        <Grid container spacing={2}>
                                            <Grid item xs={12} sm={6}>
                                                <Typography variant="body2" color="text.secondary" mb={1}>
                                                    TxID
                                                </Typography>
                                                <Typography variant="body2" color='black'>
                                                    {`${selectedTransaction.txHash.slice(0, selectedTransaction.txHash.length - 18)}...`}
                                                    <Link color='inherit' underline='none' target='_blank' href={`${getNetworkExplorerBase(chainId)}${selectedTransaction.txHash}`}>
                                                        <IconButton>
                                                            <img src={LinkIcon} alt="abrir" style={{ width: "100%", height: "100%" }} />
                                                        </IconButton>
                                                    </Link>
                                                    <CopyToClipboard
                                                        text={selectedTransaction.txHash}
                                                        onCopy={() => setTxCopied(true)}
                                                    >
                                                        <Tooltip
                                                            title={
                                                                txCopied ? (
                                                                    <Typography variant="caption" color="text.success">
                                                                        TxID copiado!
                                                                    </Typography>
                                                                ) : (
                                                                    "Copiar"
                                                                )
                                                            }
                                                            TransitionComponent={Zoom}
                                                        >
                                                            <IconButton>
                                                                <img src={CopyIcon} alt="copiar" style={{ width: "100%", height: "100%" }} />
                                                            </IconButton>
                                                        </Tooltip>
                                                    </CopyToClipboard>
                                                </Typography>
                                            </Grid>
                                        </Grid>
                                    </Box>
                                )}
                            </Box>
                        ) : <></>
                    }
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleClose} variant="contained" color="primary">Ok</Button>
                </DialogActions>
            </Dialog>
        </>
    );
}
